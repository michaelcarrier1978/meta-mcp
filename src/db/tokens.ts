import pool from './index.js';

export interface MetaToken {
  tenant_id: string;
  fb_user_id: string;
  access_token: string;
  token_expires_at: Date | null;
  scopes: string | null;
}

export async function ensureTenant(tenantId: string, name?: string): Promise<void> {
  await pool.query(
    `INSERT INTO tenants (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
    [tenantId, name ?? tenantId],
  );
}

export async function upsertToken(token: MetaToken): Promise<void> {
  await pool.query(
    `INSERT INTO meta_tokens
       (tenant_id, fb_user_id, access_token, token_expires_at, scopes)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (tenant_id) DO UPDATE SET
       fb_user_id       = EXCLUDED.fb_user_id,
       access_token     = EXCLUDED.access_token,
       token_expires_at = EXCLUDED.token_expires_at,
       scopes           = EXCLUDED.scopes,
       updated_at       = NOW()`,
    [
      token.tenant_id,
      token.fb_user_id,
      token.access_token,
      token.token_expires_at,
      token.scopes,
    ],
  );
}

export async function getToken(tenantId: string): Promise<MetaToken | null> {
  const { rows } = await pool.query<MetaToken>(
    `SELECT tenant_id, fb_user_id, access_token, token_expires_at, scopes
     FROM meta_tokens WHERE tenant_id = $1`,
    [tenantId],
  );
  return rows[0] ?? null;
}

export async function deleteToken(tenantId: string): Promise<void> {
  await pool.query(`DELETE FROM meta_tokens WHERE tenant_id = $1`, [tenantId]);
}

export async function listTenants(): Promise<Array<{ id: string; name: string; has_token: boolean }>> {
  const { rows } = await pool.query(
    `SELECT t.id, t.name,
            (mt.tenant_id IS NOT NULL) AS has_token
     FROM tenants t
     LEFT JOIN meta_tokens mt ON mt.tenant_id = t.id
     ORDER BY t.created_at DESC`,
  );
  return rows;
}
