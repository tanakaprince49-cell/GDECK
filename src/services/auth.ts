import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
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

const provider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach((scope) => {
  provider.addScope(scope);
});
provider.setCustomParameters({
  prompt: 'select_account',
});

const TOKEN_STORAGE_KEY = 'gdeck_workspace_token';
const TOKEN_TIME_KEY = 'gdeck_workspace_token_timestamp';
// Google OAuth access tokens expire after 1 hour (3600s). We mark as stale at 50 mins (3000s).
const MAX_TOKEN_AGE_MS = 50 * 60 * 1000;

let isSigningIn = false;
let cachedAccessToken: string | null = (() => {
  try {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const timeStr = localStorage.getItem(TOKEN_TIME_KEY);
    if (token && timeStr) {
      const age = Date.now() - parseInt(timeStr, 10);
      if (age < MAX_TOKEN_AGE_MS) {
        return token;
      } else {
        // Expired
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(TOKEN_TIME_KEY);
        return null;
      }
    }
    return token;
  } catch {
    return null;
  }
})();

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const storedToken = cachedAccessToken || localStorage.getItem(TOKEN_STORAGE_KEY);
      const timeStr = localStorage.getItem(TOKEN_TIME_KEY);
      let isValidToken = false;

      if (storedToken && timeStr) {
        const age = Date.now() - parseInt(timeStr, 10);
        if (age < MAX_TOKEN_AGE_MS) {
          isValidToken = true;
        }
      }

      if (isValidToken && storedToken) {
        cachedAccessToken = storedToken;
        if (onAuthSuccess) onAuthSuccess(user, storedToken);
      } else {
        cachedAccessToken = null;
        try {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          localStorage.removeItem(TOKEN_TIME_KEY);
        } catch {}
        if (!isSigningIn && onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      try {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(TOKEN_TIME_KEY);
      } catch {}
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No Google OAuth access token was returned.');
    }

    cachedAccessToken = credential.accessToken;
    const nowStr = Date.now().toString();
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, credential.accessToken);
      localStorage.setItem(TOKEN_TIME_KEY, nowStr);
    } catch {}

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Workspace Google sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (!cachedAccessToken) {
    try {
      cachedAccessToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {}
  }
  return cachedAccessToken;
};

export const setAccessTokenInMemory = (token: string | null) => {
  cachedAccessToken = token;
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(TOKEN_TIME_KEY, Date.now().toString());
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(TOKEN_TIME_KEY);
    }
  } catch {}
};

export const clearTokenAndPromptReauth = () => {
  cachedAccessToken = null;
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_TIME_KEY);
  } catch {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('gdeck_auth_expired'));
  }
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_TIME_KEY);
  } catch {}
};

export const deleteAccountPermanently = async () => {
  // 1. Revoke the Google OAuth token if active
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
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
    } catch (err) {
      console.warn('Google token revocation notice:', err);
    }
  }

  // 2. Delete user account from Firebase Auth
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
  } else {
    try {
      await signOut(auth);
    } catch {}
  }

  // 3. Clear memory reference
  cachedAccessToken = null;

  // 4. Thoroughly wipe all local storage data, preferences, chat logs, and cached documents
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (err) {
    console.warn('Local storage wipe warning:', err);
  }
};
