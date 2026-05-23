# Meta Marketing API — MCP Server

Multi-tenant MCP server exposing the Meta Marketing API over HTTP. Deploy to Railway, connect your Claude client, and manage Meta ad campaigns through natural language.

## Architecture

```
Client (Claude Desktop / Claude Code)
  │
  │  POST /mcp
  │  Header: X-Tenant-ID: <tenant>
  │
  ▼
Express + StreamableHTTP MCP Transport
  │
  ├── /auth/meta/start?tenant_id=<id>   ← Meta OAuth entry point
  ├── /auth/meta/callback               ← OAuth callback (stores token)
  ├── /tenants                          ← Admin: list tenants
  └── /mcp                             ← MCP endpoint (per-tenant token)
  │
  ▼
PostgreSQL  ←→  meta_tokens (one row per tenant)
  │
  ▼
Meta Graph API v21.0
```

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/michaelcarrier1978/meta-mcp
cd meta-mcp
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Fill in DATABASE_URL, META_APP_ID, META_APP_SECRET, META_REDIRECT_URI
```

**Meta App setup** — go to [developers.facebook.com](https://developers.facebook.com):
- Create a new app → Business type
- Add **Facebook Login** product
- Under Facebook Login → Settings, add your `META_REDIRECT_URI` as a valid OAuth redirect
- Copy App ID + App Secret into `.env`

### 3. Run locally

```bash
npm run dev         # tsx watch (no build step)
```

Or build and run:

```bash
npm run build
npm start
```

### 4. Onboard a tenant

Visit in your browser:

```
http://localhost:3000/auth/meta/start?tenant_id=acme-corp
```

Authenticate with Facebook. On success the long-lived token is stored in Postgres.

### 5. Connect your Claude client

Add to `claude_desktop_config.json` (or equivalent):

```json
{
  "mcpServers": {
    "meta-marketing": {
      "url": "http://localhost:3000/mcp",
      "headers": {
        "X-Tenant-ID": "acme-corp"
      }
    }
  }
}
```

---

## Deploy to Railway

1. Push this repo to GitHub.
2. In Railway, create a new project → **Deploy from GitHub repo**.
3. Add a **Postgres** plugin to the project.
4. Set environment variables:
   - `META_APP_ID`
   - `META_APP_SECRET`
   - `META_REDIRECT_URI` → `https://<your-railway-domain>/auth/meta/callback`
   - `ADMIN_SECRET` → a strong random string
   - `NODE_ENV=production`
   - Railway sets `DATABASE_URL` and `PORT` automatically.
5. Railway picks up `railway.toml` and runs `npm install && npm run build` then `npm start`.

---

## MCP Tools

| Tool | Description |
|---|---|
| `list_ad_accounts` | All ad accounts accessible to the user |
| `get_ad_account` | Details for a specific account |
| `list_campaigns` | Campaigns for an account (filterable by status) |
| `get_campaign` | Campaign details |
| `create_campaign` | Create a campaign with objective & budget |
| `update_campaign` | Change name, status, or budget |
| `delete_campaign` | Delete a campaign |
| `list_adsets` | Ad sets for a campaign or account |
| `get_adset` | Ad set details including targeting |
| `create_adset` | Create ad set with targeting spec |
| `update_adset` | Update ad set settings |
| `list_ads` | Ads for an ad set, campaign, or account |
| `get_ad` | Ad details |
| `update_ad` | Update ad status or name |
| `get_insights` | Performance metrics (impressions, clicks, spend, CTR, CPC, ROAS) |

---

## Admin API

All admin routes require `Authorization: Bearer <ADMIN_SECRET>`.

```
GET    /tenants              # List all tenants + token status
POST   /tenants              # Create tenant: { "id": "acme", "name": "Acme Corp" }
DELETE /tenants/:id/token    # Revoke a tenant's stored token
GET    /health               # Health check
```

---

## Multi-tenancy

Every MCP request must include:

```
X-Tenant-ID: <tenant-id>
```

The server looks up the tenant's stored access token and uses it for all Meta API calls in that request. Tenants are fully isolated — each has exactly one row in `meta_tokens`.
