import pool from './index.js';

const SQL = `
  CREATE TABLE IF NOT EXISTS tenants (
    id          VARCHAR(255) PRIMARY KEY,
    name        VARCHAR(255),
    created_at  TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS meta_tokens (
    id                SERIAL PRIMARY KEY,
    tenant_id         VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    fb_user_id        VARCHAR(255) NOT NULL,
    access_token      TEXT        NOT NULL,
    token_expires_at  TIMESTAMPTZ,
    scopes            TEXT,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id)
  );

  CREATE INDEX IF NOT EXISTS idx_meta_tokens_tenant ON meta_tokens(tenant_id);
`;

export async function runMigrations(): Promise<void> {
  await pool.query(SQL);
  console.log('[db] migrations applied');
}
