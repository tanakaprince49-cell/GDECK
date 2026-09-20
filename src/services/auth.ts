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
const persistenceReady: Promise<void> = setPersistence(auth, browserLocalPersistence)
  .then(() => undefined)
  .catch((err) => {
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
const PROFILE_KEY = 'gdeck_user_profile';
/** Refresh a few minutes before Google's ~1h access-token expiry. */
const EXPIRY_SKEW_MS = 5 * 60 * 1000;
/** Absolute fallback age if expires_at is missing (Google access tokens ≈ 3600s). */
const MAX_TOKEN_AGE_MS = 55 * 60 * 1000;

let isSigningIn = false;
let refreshInFlight: Promise<string | null> | null = null;

export type AuthFailureReason =
  | 'signed_out'
  | 'workspace_token_missing'
  | 'refresh_failed'
  | 'restoring';

export type StoredUserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

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

/** Clear access token only; keep refresh token so silent restore still works. */
function clearAccessTokenOnly() {
  cachedAccessToken = null;
  cachedExpiresAt = null;
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXPIRES_KEY);
    localStorage.removeItem(TOKEN_TIME_KEY);
  } catch {}
}

/** Full wipe of OAuth tokens (logout / delete account). */
function clearAllTokenStorage() {
  cachedAccessToken = null;
  cachedExpiresAt = null;
  cachedRefreshToken = null;
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXPIRES_KEY);
    localStorage.removeItem(TOKEN_TIME_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {}
}

/**
 * Keys that belong to the user's product data / prefs — NEVER wiped on
 * sign-out or token expiry. Only delete-account may clear these.
 */
export const GDECK_USER_DATA_KEYS = [
  'gdeck_onboarding',
  'gdeck_onboarding_completed',
  'gdeck_pinned_tools',
  'gdeck_plan_tier',
  'gdeck_pro_expires_at',
  'gdeck_pro_plan_id',
  'gdeck_pro_order_id',
  'gdeck_ai_queries_used',
  'gdeck_ai_queries_month',
  'gdeck_notifications',
  'gdeck_notification_settings',
  'gdeck_last_notified_gmail_id',
  'gdeck_last_notified_cal_id',
  'gdeck_pro_renewal_notified_day',
  'gdeck-theme',
  'gpilot_memory',
  'gpilot_chat_messages_history_v1',
  'gpilot_api_context_history_v1',
  'google_keep_notes',
  'google_messages_threads',
  'google_forms_questions_v2',
  'google_forms_responses_v2',
  'google_slides_deck_v2',
  PROFILE_KEY,
] as const;

function isAccessTokenFresh(expiresAt: number | null, accessToken: string | null): boolean {
  if (!accessToken) return false;
  if (expiresAt && Number.isFinite(expiresAt)) {
    return Date.now() < expiresAt - EXPIRY_SKEW_MS;
  }
  // No expiry recorded — allow a short grace if we have a legacy timestamp.
  try {
    const timeStr = localStorage.getItem(TOKEN_TIME_KEY);
    if (timeStr) {
      const issued = parseInt(timeStr, 10);
      if (Number.isFinite(issued) && Date.now() - issued < MAX_TOKEN_AGE_MS) {
        return true;
      }
    }
  } catch {}
  return false;
}

const initialBundle = readStoredBundle();
let cachedAccessToken: string | null = initialBundle.accessToken;
let cachedExpiresAt: number | null = initialBundle.expiresAt;
let cachedRefreshToken: string | null = initialBundle.refreshToken;

export function persistUserProfile(user: User | StoredUserProfile) {
  try {
    const profile: StoredUserProfile = {
      uid: user.uid,
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      photoURL: user.photoURL ?? null,
    };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* private mode */
  }
}

export function readStoredUserProfile(): StoredUserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (p && typeof p.uid === 'string') return p as StoredUserProfile;
  } catch {}
  return null;
}

function clearUserProfile() {
  try {
    localStorage.removeItem(PROFILE_KEY);
  } catch {}
}

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
  fatal?: boolean;
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
    } else {
      const data = await res.json().catch(() => ({}));
      const code = String(data?.code || data?.error || '');
      // invalid_grant = refresh token revoked / wrong client — need consent again
      if (code.includes('invalid_grant') || res.status === 400) {
        console.warn('[gdeck-auth] refresh rejected by server:', code || res.status);
        return { accessToken: '', expiresInSec: 0, fatal: true };
      }
    }
  } catch {
    /* fall through */
  }

  // 2) Direct Google token endpoint with public client id (no secret).
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
      if (data?.error === 'invalid_grant') {
        return { accessToken: '', expiresInSec: 0, fatal: true };
      }
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

  // Keep stale access around only until refresh succeeds; always prefer refresh.
  const refreshToken = stored.refreshToken || cachedRefreshToken;
  if (!refreshToken) {
    // No offline refresh — cannot silently restore after ~1h.
    return isAccessTokenFresh(stored.expiresAt, stored.accessToken) ? stored.accessToken : null;
  }

  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const renewed = await refreshAccessTokenWithGoogle(refreshToken);
    if (!renewed?.accessToken) {
      if (renewed?.fatal) {
        // Dead refresh token — drop it so next sign-in forces consent.
        clearAllTokenStorage();
      } else {
        // Transient failure — keep refresh token, drop dead access.
        clearAccessTokenOnly();
      }
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

export const hasStoredRefreshToken = (): boolean => {
  try {
    return !!(cachedRefreshToken || localStorage.getItem(REFRESH_TOKEN_KEY));
  } catch {
    return false;
  }
};

export const hasStoredSessionHint = (): boolean => {
  try {
    return !!(
      localStorage.getItem(REFRESH_TOKEN_KEY) ||
      localStorage.getItem(TOKEN_STORAGE_KEY) ||
      localStorage.getItem(PROFILE_KEY) ||
      localStorage.getItem('gdeck_onboarding_completed')
    );
  } catch {
    return false;
  }
};

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: (reason?: AuthFailureReason, user?: User | null) => void
) => {
  let unsub = () => {};
  let cancelled = false;
  // After authStateReady, the first callback is authoritative. Before that,
  // Firebase may emit a transient null that must NOT wipe stored refresh tokens.
  let authReady = false;

  (async () => {
    await persistenceReady;
    try {
      // Wait until Firebase has restored the user from IndexedDB (critical on refresh).
      await auth.authStateReady();
    } catch {
      /* older SDKs */
    }
    authReady = true;
    if (cancelled) return;

    // Handle the already-restored user immediately (don't wait for a second event).
    const bootUser = auth.currentUser;
    if (bootUser) {
      persistUserProfile(bootUser);
      try {
        const token = await ensureFreshAccessToken();
        if (cancelled) return;
        if (token) {
          if (onAuthSuccess) onAuthSuccess(bootUser, token);
        } else if (onAuthFailure) {
          onAuthFailure('workspace_token_missing', bootUser);
        }
      } catch (err) {
        console.warn('[gdeck-auth] boot ensureFreshAccessToken error:', err);
        if (!cancelled && onAuthFailure) onAuthFailure('refresh_failed', bootUser);
      }
    } else if (!cancelled) {
      // Truly no Firebase user after restore completed.
      // Keep local prefs + any offline refresh token so "Reconnect" still works
      // without looking like a brand-new account. Only wipe on explicit logout.
      if (onAuthFailure) onAuthFailure('signed_out', null);
    }

    unsub = onAuthStateChanged(auth, async (user: User | null) => {
      if (!authReady) return; // shouldn't happen; belt-and-suspenders

      if (!user) {
        // Don't wipe tokens mid-popup; Firebase briefly reports null during some flows.
        if (isSigningIn) {
          return;
        }
        // Signed out after a prior session. Do NOT clear refresh token / profile here —
        // logout() already does a controlled wipe. Accidental nulls must not erase session.
        if (onAuthFailure) onAuthFailure('signed_out', null);
        return;
      }

      persistUserProfile(user);

      // Firebase user restored — try silent Workspace token refresh.
      try {
        const token = await ensureFreshAccessToken();
        if (token) {
          if (onAuthSuccess) onAuthSuccess(user, token);
          return;
        }
        // Firebase session OK but no Google API token yet.
        // Do NOT wipe the Firebase user or local prefs — UI shows reconnect chrome.
        if (onAuthFailure) onAuthFailure('workspace_token_missing', user);
      } catch (err) {
        console.warn('[gdeck-auth] ensureFreshAccessToken error:', err);
        if (onAuthFailure) onAuthFailure('refresh_failed', user);
      }
    });
  })();

  return () => {
    cancelled = true;
    try {
      unsub();
    } catch {}
  };
};

async function runGooglePopup(forceConsent: boolean): Promise<{ user: User; accessToken: string }> {
  await persistenceReady;
  isSigningIn = true;
  try {
    const hasRefresh = !!(cachedRefreshToken || readStoredBundle().refreshToken);
    // Always request offline access. Force consent when we still need a refresh token.
    provider.setCustomParameters({
      access_type: 'offline',
      prompt: forceConsent || !hasRefresh ? 'consent' : 'select_account',
      include_granted_scopes: 'true',
    });

    const result = await signInWithPopup(auth, provider);
    const extracted = extractGoogleOAuthFromResult(result);
    if (!extracted.accessToken) {
      throw new Error('No Google OAuth access token was returned.');
    }

    const priorRefresh = cachedRefreshToken || readStoredBundle().refreshToken;
    const refreshToStore = extracted.refreshToken || priorRefresh || null;
    const expiresAtMs = Date.now() + extracted.expiresInSec * 1000;
    persistTokenBundle(extracted.accessToken, expiresAtMs, refreshToStore);
    persistUserProfile(result.user);

    if (!refreshToStore) {
      console.warn(
        '[gdeck-auth] No Google refresh token returned. Stay-signed-in across refresh needs one consent pass (access_type=offline).'
      );
    }

    return { user: result.user, accessToken: extracted.accessToken };
  } finally {
    isSigningIn = false;
  }
}

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    // First-time or missing refresh → force consent so we capture offline refresh token.
    const hasRefresh = hasStoredRefreshToken();
    return await runGooglePopup(!hasRefresh);
  } catch (error: any) {
    console.error('Workspace Google sign in error:', error);
    throw error;
  }
};

/**
 * Interactive reconnect when silent refresh fails but Firebase user may still exist.
 * Forces consent once so we capture a refresh token for future silent restores.
 */
export const reconnectWorkspace = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    return await runGooglePopup(true);
  } catch (error: any) {
    console.error('Workspace reconnect error:', error);
    throw error;
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
    clearAccessTokenOnly();
  }
};

export const clearTokenAndPromptReauth = () => {
  // Keep refresh token — silent restore may still succeed.
  clearAccessTokenOnly();
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
  try {
    await signOut(auth);
  } catch {}
  clearAllTokenStorage();
  clearUserProfile();
  // Intentionally do NOT clear GDECK_USER_DATA_KEYS — pins, Pro, chat, onboarding stay.
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

  clearAllTokenStorage();
  clearUserProfile();

  // Only delete-account wipes product data.
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (err) {
    console.warn('Local storage wipe warning:', err);
  }
};

export const getCurrentUser = () => auth.currentUser;
