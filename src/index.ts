import 'dotenv/config';
import { runMigrations } from './db/migrations.js';
import { buildApp } from './server.js';

const PORT = Number(process.env.PORT ?? 3000);

async function main() {
  await runMigrations();

  const app = buildApp();
  app.listen(PORT, () => {
    console.log(`[server] listening on http://localhost:${PORT}`);
    console.log(`[server] MCP endpoint: POST http://localhost:${PORT}/mcp  (header: X-Tenant-ID: <id>)`);
    console.log(`[server] OAuth start:  GET  http://localhost:${PORT}/auth/meta/start?tenant_id=<id>`);
  });
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
