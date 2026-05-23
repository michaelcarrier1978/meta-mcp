import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import oauthRoutes from './oauth/routes.js';
import { createMcpServer } from './mcp/server.js';
import { getToken, listTenants, ensureTenant, deleteToken } from './db/tokens.js';

export function buildApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // ── Health ──────────────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', ts: new Date().toISOString() });
  });

  // ── Meta OAuth ──────────────────────────────────────────────────────────────
  app.use('/auth/meta', oauthRoutes);

  // ── Admin: tenant management ────────────────────────────────────────────────
  // Protect with a simple bearer token from env
  function requireAdmin(req: Request, res: Response, next: NextFunction) {
    const secret = process.env.ADMIN_SECRET;
    if (secret) {
      const auth = req.headers.authorization ?? '';
      if (auth !== `Bearer ${secret}`) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
    }
    next();
  }

  app.get('/tenants', requireAdmin, async (_req, res) => {
    const tenants = await listTenants();
    res.json(tenants);
  });

  app.post('/tenants', requireAdmin, async (req, res) => {
    const { id, name } = req.body as { id?: string; name?: string };
    if (!id) { res.status(400).json({ error: 'id required' }); return; }
    await ensureTenant(id, name);
    res.json({ ok: true, id });
  });

  app.delete('/tenants/:id/token', requireAdmin, async (req, res) => {
    await deleteToken(req.params['id']!);
    res.json({ ok: true });
  });

  // ── MCP endpoint (StreamableHTTP, stateless) ────────────────────────────────
  //
  // Clients must pass X-Tenant-ID header identifying which tenant's token to use.
  // Each POST is handled as an independent stateless MCP session.
  //
  app.post('/mcp', async (req: Request, res: Response) => {
    const tenantId = req.headers['x-tenant-id'] as string | undefined;

    if (!tenantId) {
      res.status(400).json({
        jsonrpc: '2.0',
        error: { code: -32600, message: 'X-Tenant-ID header is required' },
        id: null,
      });
      return;
    }

    // Skip token check for initialize so clients can detect the server before authing
    const body = req.body as { method?: string };
    const isInit = isInitializeRequest(body);

    if (!isInit) {
      const token = await getToken(tenantId);
      if (!token) {
        res.status(401).json({
          jsonrpc: '2.0',
          error: {
            code: -32001,
            message: `No Meta token found for tenant "${tenantId}". Visit /auth/meta/start?tenant_id=${tenantId} to connect.`,
          },
          id: null,
        });
        return;
      }

      const server = createMcpServer(token.access_token);
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // stateless — no session cookie
      });

      res.on('close', () => server.close());
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    }

    // initialize path — no token needed yet
    // We still need a valid token to actually serve tools, but we allow init to succeed
    // so the client can discover capabilities.
    const dummyServer = createMcpServer('');
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on('close', () => dummyServer.close());
    await dummyServer.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  // SSE GET (for servers that push notifications — not strictly needed for stateless mode)
  app.get('/mcp', (_req, res) => {
    res.status(405).json({ error: 'Use POST /mcp for stateless MCP requests' });
  });

  return app;
}
