import { Router, type Request, type Response } from 'express';
import { exchangeCodeForLongLivedToken } from '../meta/client.js';
import { ensureTenant, upsertToken } from '../db/tokens.js';

const router = Router();

const META_DIALOG_URL = 'https://www.facebook.com/v21.0/dialog/oauth';

// Scopes required for the Marketing API
const SCOPES = [
  'ads_read',
  'ads_management',
  'business_management',
  'public_profile',
].join(',');

/**
 * GET /auth/meta/start?tenant_id=<id>
 *
 * Kicks off the Meta OAuth flow for the given tenant.
 * Encodes tenant_id in the `state` parameter to retrieve it on callback.
 */
router.get('/start', (req: Request, res: Response) => {
  const tenantId = req.query['tenant_id'] as string | undefined;
  if (!tenantId) {
    res.status(400).json({ error: 'tenant_id query param required' });
    return;
  }

  const state = Buffer.from(JSON.stringify({ tenant_id: tenantId })).toString('base64url');

  const authUrl = new URL(META_DIALOG_URL);
  authUrl.searchParams.set('client_id',     process.env.META_APP_ID!);
  authUrl.searchParams.set('redirect_uri',  process.env.META_REDIRECT_URI!);
  authUrl.searchParams.set('scope',         SCOPES);
  authUrl.searchParams.set('state',         state);
  authUrl.searchParams.set('response_type', 'code');

  res.redirect(authUrl.toString());
});

/**
 * GET /auth/meta/callback?code=<code>&state=<state>
 *
 * Receives the OAuth callback, exchanges code for a long-lived token,
 * and stores it in Postgres.
 */
router.get('/callback', async (req: Request, res: Response) => {
  const { code, state, error, error_description } = req.query as Record<string, string | undefined>;

  if (error) {
    res.status(400).send(`Meta OAuth error: ${error_description ?? error}`);
    return;
  }

  if (!code || !state) {
    res.status(400).json({ error: 'Missing code or state' });
    return;
  }

  let tenantId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString('utf8')) as { tenant_id: string };
    tenantId = decoded.tenant_id;
  } catch {
    res.status(400).json({ error: 'Invalid state parameter' });
    return;
  }

  try {
    const { access_token, expires_in } = await exchangeCodeForLongLivedToken(code);

    // Fetch the user's Facebook ID to store alongside the token
    const meRes = await fetch(
      `https://graph.facebook.com/v21.0/me?fields=id&access_token=${access_token}`,
    );
    const me = (await meRes.json()) as { id: string; error?: { message: string } };
    if (me.error) throw new Error(me.error.message);

    await ensureTenant(tenantId);
    await upsertToken({
      tenant_id:        tenantId,
      fb_user_id:       me.id,
      access_token,
      token_expires_at: expires_in ? new Date(Date.now() + expires_in * 1000) : null,
      scopes:           SCOPES,
    });

    res.send(`
      <html><body style="font-family:sans-serif;padding:40px">
        <h2>✅ Meta account connected</h2>
        <p>Tenant <strong>${tenantId}</strong> is now authenticated.</p>
        <p>You can close this window.</p>
      </body></html>
    `);
  } catch (e) {
    console.error('[oauth] callback error:', e);
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
