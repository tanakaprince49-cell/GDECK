import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  User,
  UserCredential,
  signOut,
  deleteUser,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/chat.spaces.readonly',
  'https://www.googleapis.com/auth/chat.messages',
  'https://www.googleapis.com/auth/contacts.readonly',
  'https://www.googleapis.com/auth/contacts',
  'https://www.googleapis.com/auth/meetings.space.created',
  'https://www.googleapis.com/auth/meetings.space.readonly',
  'https://www.googleapis.com/auth/forms.body.readonly',
  'https://www.googleapis.com/auth/forms.responses.readonly',
];

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

/** Keep Firebase Auth in localStorage/IndexedDB so the Google account survives refresh forever. */
const persistenceReady: Promise<void> = setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('[gdeck-auth] setPersistence failed, falling back to default:', err);
});

const provider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach((scope) => {
  provider.addScope(scope);
});

const TOKEN_STORAGE_KEY = 'gdeck_workspace_token';
const TOKEN_EXPIRES_KEY = 'gdeck_workspace_token_expires_at';
const REFRESH_TOKEN_KEY = 'gdeck_google_refresh_token';
const TOKEN_TIME_KEY = 'gdeck_workspace_token_timestamp'; // legacy
/** Refresh a few minutes before Google's ~1h access-token expiry. */
const EXPIRY_SKEW_MS = 5 * 60 * 1000;
/** Absolute fallback age if expires_at is missing (Google access tokens ≈ 3600s). */
const MAX_TOKEN_AGE_MS = 55 * 60 * 1000;

let isSigningIn = false;
let refreshInFlight: Promise<string | null> | null = null;

type StoredTokenBundle = {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
};

function readStoredBundle(): StoredTokenBundle {
  try {
    const accessToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const expiresRaw = localStorage.getItem(TOKEN_EXPIRES_KEY);
    let expiresAt = expiresRaw ? parseInt(expiresRaw, 10) : null;
    if (!Number.isFinite(expiresAt as number)) expiresAt = null;

    // Migrate legacy timestamp-only storage → synthetic expiry.
    if (accessToken && !expiresAt) {
      const timeStr = localStorage.getItem(TOKEN_TIME_KEY);
      if (timeStr) {
        const issued = parseInt(timeStr, 10);
        if (Number.isFinite(issued)) {
          expiresAt = issued + 60 * 60 * 1000;
        }
      }
    }

    return { accessToken, refreshToken, expiresAt };
  } catch {
    return { accessToken: null, refreshToken: null, expiresAt: null };
  }
}

function persistTokenBundle(accessToken: string, expiresAtMs: number, refreshToken?: string | null) {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
    localStorage.setItem(TOKEN_EXPIRES_KEY, String(expiresAtMs));
    localStorage.setItem(TOKEN_TIME_KEY, String(Date.now()));
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  } catch {
    /* private mode */
  }
  cachedAccessToken = accessToken;
  cachedExpiresAt = expiresAtMs;
  if (refreshToken) cachedRefreshToken = refreshToken;
}

function clearTokenStorage(keepRefresh = false) {
  cachedAccessToken = null;
  cachedExpiresAt = null;
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXPIRES_KEY);
    localStorage.removeItem(TOKEN_TIME_KEY);
    if (!keepRefresh) {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      cachedRefreshToken = null;
    }
  } catch {}
}

function isAccessTokenFresh(expiresAt: number | null, accessToken: string | null): boolean {
  if (!accessToken) return false;
  if (expiresAt && Number.isFinite(expiresAt)) {
    return Date.now() < expiresAt - EXPIRY_SKEW_MS;
  }
  // No expiry recorded — treat as stale so we refresh rather than send a dead token.
  return false;
}

const initialBundle = readStoredBundle();
let cachedAccessToken: string | null = isAccessTokenFresh(initialBundle.expiresAt, initialBundle.accessToken)
  ? initialBundle.accessToken
  : initialBundle.accessToken; // keep around for refresh attempt even if stale
let cachedExpiresAt: number | null = initialBundle.expiresAt;
let cachedRefreshToken: string | null = initialBundle.refreshToken;

function extractGoogleOAuthFromResult(result: UserCredential): {
  accessToken: string | null;
  refreshToken: string | null;
  expiresInSec: number;
} {
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const anyResult = result as any;
  const tr = anyResult?._tokenResponse || {};

  const accessToken: string | null =
    credential?.accessToken ||
    (typeof tr.oauthAccessToken === 'string' ? tr.oauthAccessToken : null) ||
    null;

  // Google's offline refresh token (NOT Firebase user.refreshToken).
  // Present when access_type=offline + prompt=consent was used.
  let refreshToken: string | null = null;
  if (typeof tr.oauthRefreshToken === 'string' && tr.oauthRefreshToken.length > 10) {
    refreshToken = tr.oauthRefreshToken;
  } else if (typeof tr.refreshToken === 'string' && String(tr.refreshToken).startsWith('1//')) {
    // Google refresh tokens commonly start with "1//"
    refreshToken = tr.refreshToken;
  }

  const expiresInSec = Number(tr.oauthExpireIn || tr.expiresIn || 3600) || 3600;

  return { accessToken, refreshToken, expiresInSec };
}

/**
 * Exchange a Google refresh token for a fresh access token.
 * Tries same-origin `/api/auth/google-refresh` first (has client secret when configured),
 * then a public client_id-only request (works for some OAuth client types).
 */
async function refreshAccessTokenWithGoogle(refreshToken: string): Promise<{
  accessToken: string;
  expiresInSec: number;
  refreshToken?: string;
} | null> {
  const clientId =
    (firebaseConfig as any).oAuthClientId ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GOOGLE_OAUTH_CLIENT_ID) ||
    '';

  // 1) Server proxy (preferred — can hold GOOGLE_OAUTH_CLIENT_SECRET)
  try {
    const res = await fetch('/api/auth/google-refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.accessToken) {
        return {
          accessToken: data.accessToken,
          expiresInSec: Number(data.expiresIn) || 3600,
          refreshToken: data.refreshToken || undefined,
        };
      }
    }
  } catch {
    /* fall through */
  }

  // 2) Direct Google token endpoint with public client id (no secret).
  // Works when the OAuth client is configured to allow it; otherwise server route is required.
  if (!clientId) return null;
  try {
    const body = new URLSearchParams({
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) {
      console.warn('[gdeck-auth] Google refresh failed:', data?.error || res.status);
      return null;
    }
    return {
      accessToken: data.access_token as string,
      expiresInSec: Number(data.expires_in) || 3600,
      refreshToken: typeof data.refresh_token === 'string' ? data.refresh_token : undefined,
    };
  } catch (err) {
    console.warn('[gdeck-auth] Google refresh network error:', err);
    return null;
  }
}

/**
 * Ensure we have a fresh Google Workspace access token.
 * - Uses cached token if still valid
 * - Else refreshes via stored Google refresh token (silent — no popup)
 * Returns null only if the user must interactively sign in again.
 */
export async function ensureFreshAccessToken(): Promise<string | null> {
  await persistenceReady;

  if (isAccessTokenFresh(cachedExpiresAt, cachedAccessToken) && cachedAccessToken) {
    return cachedAccessToken;
  }

  // Re-read storage in case another tab refreshed.
  const stored = readStoredBundle();
  if (isAccessTokenFresh(stored.expiresAt, stored.accessToken) && stored.accessToken) {
    cachedAccessToken = stored.accessToken;
    cachedExpiresAt = stored.expiresAt;
    cachedRefreshToken = stored.refreshToken || cachedRefreshToken;
    return stored.accessToken;
  }

  const refreshToken = stored.refreshToken || cachedRefreshToken;
  if (!refreshToken) {
    return null;
  }

  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const renewed = await refreshAccessTokenWithGoogle(refreshToken);
    if (!renewed?.accessToken) {
      // Refresh token dead/revoked — clear access only; keep trying interactive sign-in next.
      clearTokenStorage(true);
      return null;
    }
    const expiresAtMs = Date.now() + renewed.expiresInSec * 1000;
    persistTokenBundle(renewed.accessToken, expiresAtMs, renewed.refreshToken || refreshToken);
    return renewed.accessToken;
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: (reason?: string) => void
) => {
  let unsub = () => {};

  persistenceReady.then(() => {
    unsub = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) {
        // Only clear tokens when Firebase itself has no user (explicit logout / never signed in).
        clearTokenStorage(false);
        if (onAuthFailure) onAuthFailure('signed_out');
        return;
      }

      // Firebase user restored from persistence — stay signed in; refresh Google API token silently.
      try {
        const token = await ensureFreshAccessToken();
        if (token) {
          if (onAuthSuccess) onAuthSuccess(user, token);
          return;
        }
        // Firebase session OK but no Google API token yet (first load after deploy / expired refresh).
        // Do NOT wipe the Firebase user — UI can show "Reconnect Workspace" while still knowing who they are.
        if (onAuthFailure) onAuthFailure('workspace_token_missing');
      } catch (err) {
        console.warn('[gdeck-auth] ensureFreshAccessToken error:', err);
        if (onAuthFailure) onAuthFailure('refresh_failed');
      }
    });
  });

  return () => {
    try {
      unsub();
    } catch {}
  };
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  await persistenceReady;
  try {
    isSigningIn = true;

    // Offline access so we can refresh the Workspace token without another popup.
    // prompt: consent the first time we don't have a refresh token; otherwise select_account.
    const hasRefresh = !!(cachedRefreshToken || readStoredBundle().refreshToken);
    provider.setCustomParameters({
      access_type: 'offline',
      prompt: hasRefresh ? 'select_account' : 'consent',
    });

    const result = await signInWithPopup(auth, provider);
    const extracted = extractGoogleOAuthFromResult(result);
    if (!extracted.accessToken) {
      throw new Error('No Google OAuth access token was returned.');
    }

    const expiresAtMs = Date.now() + extracted.expiresInSec * 1000;
    persistTokenBundle(
      extracted.accessToken,
      expiresAtMs,
      extracted.refreshToken || cachedRefreshToken || readStoredBundle().refreshToken
    );

    if (!extracted.refreshToken && !readStoredBundle().refreshToken) {
      console.warn(
        '[gdeck-auth] No Google refresh token returned. Stay-signed-in across hour boundaries needs a one-time consent popup (access_type=offline).'
      );
    }

    return { user: result.user, accessToken: extracted.accessToken };
  } catch (error: any) {
    console.error('Workspace Google sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Interactive reconnect when silent refresh fails but Firebase user may still exist.
 * Forces consent once so we capture a refresh token.
 */
export const reconnectWorkspace = async (): Promise<{ user: User; accessToken: string } | null> => {
  await persistenceReady;
  try {
    isSigningIn = true;
    provider.setCustomParameters({
      access_type: 'offline',
      prompt: 'consent',
    });
    const result = await signInWithPopup(auth, provider);
    const extracted = extractGoogleOAuthFromResult(result);
    if (!extracted.accessToken) {
      throw new Error('No Google OAuth access token was returned.');
    }
    const expiresAtMs = Date.now() + extracted.expiresInSec * 1000;
    persistTokenBundle(extracted.accessToken, expiresAtMs, extracted.refreshToken);
    return { user: result.user, accessToken: extracted.accessToken };
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return ensureFreshAccessToken();
};

export const setAccessTokenInMemory = (token: string | null) => {
  if (token) {
    // Unknown expiry — mark ~55 min so we refresh soon rather than assume forever.
    persistTokenBundle(token, Date.now() + MAX_TOKEN_AGE_MS, cachedRefreshToken);
  } else {
    clearTokenStorage(true);
  }
};

export const clearTokenAndPromptReauth = () => {
  clearTokenStorage(true);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('gdeck_auth_expired', {
        detail: { message: 'Google Workspace access expired. Reconnecting…', recoverable: true },
      })
    );
  }
};

export const logout = async () => {
  await persistenceReady;
  await signOut(auth);
  clearTokenStorage(false);
};

export const deleteAccountPermanently = async () => {
  let currentToken = cachedAccessToken;
  if (!currentToken) {
    try {
      currentToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {}
  }
  if (currentToken) {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(currentToken)}`, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
    } catch (err) {
      console.warn('Google token revocation notice:', err);
    }
  }

  const refresh = cachedRefreshToken || readStoredBundle().refreshToken;
  if (refresh) {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refresh)}`, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
    } catch {}
  }

  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      await deleteUser(currentUser);
    } catch (err: any) {
      console.warn('Firebase user deletion notice (falling back to signOut):', err);
      try {
        await signOut(auth);
      } catch {}
    }
  }

  try {
    await signOut(auth);
  } catch {}

  clearTokenStorage(false);

  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (err) {
    console.warn('Local storage wipe warning:', err);
  }
};

export const getCurrentUser = () => auth.currentUser;
