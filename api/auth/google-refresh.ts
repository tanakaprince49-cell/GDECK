import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * POST /api/auth/google-refresh
 * Body: { refreshToken: string }
 *
 * Exchanges a Google OAuth refresh token for a fresh access token.
 * Uses GOOGLE_OAUTH_CLIENT_ID (+ optional GOOGLE_OAUTH_CLIENT_SECRET) from env,
 * falling back to the Firebase web client id baked into the project config.
 *
 * Set in Vercel (Production):
 *   GOOGLE_OAUTH_CLIENT_ID=...apps.googleusercontent.com
 *   GOOGLE_OAUTH_CLIENT_SECRET=...   (required for "Web" OAuth clients)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const refreshToken =
    (typeof req.body === 'object' && req.body?.refreshToken) ||
    (typeof req.body === 'object' && req.body?.refresh_token) ||
    null;

  if (!refreshToken || typeof refreshToken !== 'string') {
    return res.status(400).json({ error: 'refreshToken is required' });
  }

  let clientId =
    process.env.GOOGLE_OAUTH_CLIENT_ID ||
    process.env.VITE_GOOGLE_OAUTH_CLIENT_ID ||
    '';
  const clientSecret =
    process.env.GOOGLE_OAUTH_CLIENT_SECRET ||
    process.env.VITE_GOOGLE_OAUTH_CLIENT_SECRET ||
    '';

  // Fallback to the Firebase applet config client id shipped with the repo.
  if (!clientId) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const cfg = require('../../firebase-applet-config.json');
      clientId = cfg?.oAuthClientId || '';
    } catch {
      /* ignore */
    }
  }

  if (!clientId) {
    return res.status(500).json({
      error: 'GOOGLE_OAUTH_CLIENT_ID is not configured on the server',
      code: 'missing_client_id',
    });
  }

  try {
    const params = new URLSearchParams({
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });
    if (clientSecret) {
      params.set('client_secret', clientSecret);
    }

    const googleRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    const data: any = await googleRes.json().catch(() => ({}));

    if (!googleRes.ok || !data.access_token) {
      console.warn('[google-refresh] upstream error:', data?.error, data?.error_description);
      // Pass Google's error code through unchanged so the client can tell
      // invalid_grant (fatal — re-consent) from invalid_client / missing secret
      // (transient — keep the refresh token, do NOT bounce the user to privacy).
      const code = String(data?.error || 'refresh_failed');
      const status =
        code === 'invalid_grant' ? 400 : googleRes.status === 400 ? 400 : 502;
      return res.status(status).json({
        error: data?.error_description || data?.error || 'Failed to refresh Google access token',
        code,
      });
    }

    return res.status(200).json({
      accessToken: data.access_token,
      expiresIn: Number(data.expires_in) || 3600,
      tokenType: data.token_type || 'Bearer',
      scope: data.scope,
      // Google only returns a new refresh_token on rotation; pass through if present.
      refreshToken: data.refresh_token || undefined,
    });
  } catch (err: any) {
    console.error('[google-refresh] network error:', err?.message || err);
    return res.status(500).json({ error: err?.message || 'Refresh request failed' });
  }
}
