import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { MetaClient, MetaApiError } from '../../meta/client.js';

// ── Tool definitions ─────────────────────────────────────────────────────────

export const TOOL_DEFINITIONS: Tool[] = [
  // Ad Accounts
  {
    name: 'list_ad_accounts',
    description: 'List all Meta ad accounts the authenticated user can access.',
    inputSchema: {
      type: 'object',
      properties: {
        fields: { type: 'string', description: 'Comma-separated fields (default: id,name,account_status,currency,timezone_name,amount_spent)' },
        limit:  { type: 'number', description: 'Max results (default 25)' },
      },
    },
  },
  {
    name: 'get_ad_account',
    description: 'Get details for a specific Meta ad account.',
    inputSchema: {
      type: 'object',
      properties: {
        account_id: { type: 'string', description: 'Ad account ID, e.g. act_123456789' },
        fields:     { type: 'string', description: 'Comma-separated fields to return' },
      },
      required: ['account_id'],
    },
  },

  // Campaigns
  {
    name: 'list_campaigns',
    description: 'List campaigns for a Meta ad account.',
    inputSchema: {
      type: 'object',
      properties: {
        account_id: { type: 'string', description: 'Ad account ID (act_...)' },
        status:     { type: 'string', description: 'Filter by status: ACTIVE, PAUSED, DELETED, ARCHIVED (omit for all)' },
        fields:     { type: 'string', description: 'Comma-separated fields' },
        limit:      { type: 'number', description: 'Max results (default 25)' },
      },
      required: ['account_id'],
    },
  },
  {
    name: 'get_campaign',
    description: 'Get details for a specific campaign.',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'string' },
        fields:      { type: 'string' },
      },
      required: ['campaign_id'],
    },
  },
  {
    name: 'create_campaign',
    description: 'Create a new Meta ad campaign.',
    inputSchema: {
      type: 'object',
      properties: {
        account_id:        { type: 'string', description: 'Ad account ID (act_...)' },
        name:              { type: 'string', description: 'Campaign name' },
        objective:         { type: 'string', description: 'e.g. OUTCOME_TRAFFIC, OUTCOME_AWARENESS, OUTCOME_LEADS, OUTCOME_SALES' },
        status:            { type: 'string', description: 'ACTIVE or PAUSED (default PAUSED)' },
        special_ad_categories: { type: 'array', items: { type: 'string' }, description: 'e.g. [] or ["CREDIT","HOUSING"]' },
        daily_budget:      { type: 'number', description: 'Daily budget in cents (e.g. 5000 = $50.00)' },
        lifetime_budget:   { type: 'number', description: 'Lifetime budget in cents' },
      },
      required: ['account_id', 'name', 'objective'],
    },
  },
  {
    name: 'update_campaign',
    description: 'Update a campaign (status, name, budget, etc.).',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id:   { type: 'string' },
        name:          { type: 'string' },
        status:        { type: 'string', description: 'ACTIVE or PAUSED' },
        daily_budget:  { type: 'number' },
        lifetime_budget: { type: 'number' },
      },
      required: ['campaign_id'],
    },
  },
  {
    name: 'delete_campaign',
    description: 'Delete a Meta campaign.',
    inputSchema: {
      type: 'object',
      properties: { campaign_id: { type: 'string' } },
      required: ['campaign_id'],
    },
  },

  // Ad Sets
  {
    name: 'list_adsets',
    description: 'List ad sets for a campaign or ad account.',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'string', description: 'Filter by campaign' },
        account_id:  { type: 'string', description: 'Filter by account (use if no campaign_id)' },
        status:      { type: 'string', description: 'ACTIVE, PAUSED, DELETED, ARCHIVED' },
        fields:      { type: 'string' },
        limit:       { type: 'number' },
      },
    },
  },
  {
    name: 'get_adset',
    description: 'Get details for a specific ad set.',
    inputSchema: {
      type: 'object',
      properties: {
        adset_id: { type: 'string' },
        fields:   { type: 'string' },
      },
      required: ['adset_id'],
    },
  },
  {
    name: 'create_adset',
    description: 'Create an ad set within a campaign.',
    inputSchema: {
      type: 'object',
      properties: {
        account_id:          { type: 'string', description: 'Ad account ID (act_...)' },
        campaign_id:         { type: 'string' },
        name:                { type: 'string' },
        optimization_goal:   { type: 'string', description: 'e.g. LINK_CLICKS, IMPRESSIONS, REACH, LANDING_PAGE_VIEWS' },
        billing_event:       { type: 'string', description: 'e.g. IMPRESSIONS, LINK_CLICKS' },
        bid_amount:          { type: 'number', description: 'Bid in cents' },
        daily_budget:        { type: 'number', description: 'Daily budget in cents' },
        lifetime_budget:     { type: 'number', description: 'Lifetime budget in cents' },
        start_time:          { type: 'string', description: 'ISO 8601 datetime' },
        end_time:            { type: 'string', description: 'ISO 8601 datetime' },
        status:              { type: 'string', description: 'ACTIVE or PAUSED (default PAUSED)' },
        targeting:           { type: 'object', description: 'Meta targeting spec JSON (age_min, age_max, genders, geo_locations, interests, etc.)' },
      },
      required: ['account_id', 'campaign_id', 'name', 'optimization_goal', 'billing_event'],
    },
  },
  {
    name: 'update_adset',
    description: 'Update an ad set.',
    inputSchema: {
      type: 'object',
      properties: {
        adset_id:      { type: 'string' },
        name:          { type: 'string' },
        status:        { type: 'string' },
        daily_budget:  { type: 'number' },
        lifetime_budget: { type: 'number' },
        end_time:      { type: 'string' },
        targeting:     { type: 'object' },
      },
      required: ['adset_id'],
    },
  },

  // Ads
  {
    name: 'list_ads',
    description: 'List ads for a campaign, ad set, or account.',
    inputSchema: {
      type: 'object',
      properties: {
        adset_id:    { type: 'string' },
        campaign_id: { type: 'string' },
        account_id:  { type: 'string' },
        status:      { type: 'string' },
        fields:      { type: 'string' },
        limit:       { type: 'number' },
      },
    },
  },
  {
    name: 'get_ad',
    description: 'Get details for a specific ad.',
    inputSchema: {
      type: 'object',
      properties: {
        ad_id:  { type: 'string' },
        fields: { type: 'string' },
      },
      required: ['ad_id'],
    },
  },
  {
    name: 'update_ad',
    description: 'Update an ad (status, name, creative).',
    inputSchema: {
      type: 'object',
      properties: {
        ad_id:  { type: 'string' },
        name:   { type: 'string' },
        status: { type: 'string', description: 'ACTIVE or PAUSED' },
      },
      required: ['ad_id'],
    },
  },

  // Insights
  {
    name: 'get_insights',
    description: 'Fetch performance insights for an account, campaign, ad set, or ad.',
    inputSchema: {
      type: 'object',
      properties: {
        object_id:   { type: 'string', description: 'Account ID (act_...), campaign ID, adset ID, or ad ID' },
        level:       { type: 'string', description: 'account | campaign | adset | ad (default: campaign)' },
        date_preset: { type: 'string', description: 'today, yesterday, last_7_days, last_30_days, last_month, this_month, this_year (default: last_30_days)' },
        time_range:  { type: 'object', description: '{ since: "YYYY-MM-DD", until: "YYYY-MM-DD" } — overrides date_preset' },
        fields:      { type: 'string', description: 'Comma-separated metrics (default: impressions,clicks,spend,ctr,cpc,reach,frequency,actions)' },
        breakdowns:  { type: 'string', description: 'e.g. age,gender or country' },
        limit:       { type: 'number' },
      },
      required: ['object_id'],
    },
  },
];

// ── Tool handlers ─────────────────────────────────────────────────────────────

type Args = Record<string, unknown>;

function str(v: unknown, fallback = ''): string {
  return v != null ? String(v) : fallback;
}

function ok(result: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
}

function err(e: unknown) {
  const msg = e instanceof MetaApiError
    ? `Meta API error (${e.code}): ${e.message}`
    : e instanceof Error ? e.message : String(e);
  return { content: [{ type: 'text' as const, text: msg }], isError: true };
}

export async function callTool(
  client: MetaClient,
  name: string,
  args: Args,
): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> {
  try {
    switch (name) {
      // ── Ad Accounts ──────────────────────────────────────────────────────
      case 'list_ad_accounts': {
        const fields = str(args.fields, 'id,name,account_status,currency,timezone_name,amount_spent');
        const limit  = str(args.limit, '25');
        return ok(await client.get('/me/adaccounts', { fields, limit }));
      }

      case 'get_ad_account': {
        const fields = str(args.fields, 'id,name,account_status,currency,timezone_name,spend_cap,amount_spent,balance');
        return ok(await client.get(`/${args.account_id}`, { fields }));
      }

      // ── Campaigns ────────────────────────────────────────────────────────
      case 'list_campaigns': {
        const fields  = str(args.fields, 'id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time');
        const params: Record<string, string> = { fields, limit: str(args.limit, '25') };
        if (args.status) params['effective_status'] = `["${args.status}"]`;
        return ok(await client.get(`/${args.account_id}/campaigns`, params));
      }

      case 'get_campaign': {
        const fields = str(args.fields, 'id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time,buying_type');
        return ok(await client.get(`/${args.campaign_id}`, { fields }));
      }

      case 'create_campaign': {
        const body: Record<string, unknown> = {
          name:      args.name,
          objective: args.objective,
          status:    args.status ?? 'PAUSED',
          special_ad_categories: args.special_ad_categories ?? [],
        };
        if (args.daily_budget)    body['daily_budget']    = args.daily_budget;
        if (args.lifetime_budget) body['lifetime_budget'] = args.lifetime_budget;
        return ok(await client.post(`/${args.account_id}/campaigns`, body));
      }

      case 'update_campaign': {
        const body: Record<string, unknown> = {};
        if (args.name)             body['name']             = args.name;
        if (args.status)           body['status']           = args.status;
        if (args.daily_budget)     body['daily_budget']     = args.daily_budget;
        if (args.lifetime_budget)  body['lifetime_budget']  = args.lifetime_budget;
        return ok(await client.post(`/${args.campaign_id}`, body));
      }

      case 'delete_campaign': {
        return ok(await client.delete(`/${args.campaign_id}`));
      }

      // ── Ad Sets ──────────────────────────────────────────────────────────
      case 'list_adsets': {
        const fields  = str(args.fields, 'id,name,status,campaign_id,daily_budget,lifetime_budget,targeting,optimization_goal,billing_event');
        const params: Record<string, string> = { fields, limit: str(args.limit, '25') };
        if (args.status) params['effective_status'] = `["${args.status}"]`;

        const parent = args.campaign_id ?? args.account_id;
        if (!parent) throw new Error('Provide campaign_id or account_id');
        return ok(await client.get(`/${parent}/adsets`, params));
      }

      case 'get_adset': {
        const fields = str(args.fields, 'id,name,status,campaign_id,daily_budget,lifetime_budget,targeting,optimization_goal,billing_event,start_time,end_time');
        return ok(await client.get(`/${args.adset_id}`, { fields }));
      }

      case 'create_adset': {
        const body: Record<string, unknown> = {
          name:               args.name,
          campaign_id:        args.campaign_id,
          optimization_goal:  args.optimization_goal,
          billing_event:      args.billing_event,
          status:             args.status ?? 'PAUSED',
        };
        if (args.bid_amount)      body['bid_amount']      = args.bid_amount;
        if (args.daily_budget)    body['daily_budget']    = args.daily_budget;
        if (args.lifetime_budget) body['lifetime_budget'] = args.lifetime_budget;
        if (args.start_time)      body['start_time']      = args.start_time;
        if (args.end_time)        body['end_time']        = args.end_time;
        if (args.targeting)       body['targeting']       = args.targeting;
        return ok(await client.post(`/${args.account_id}/adsets`, body));
      }

      case 'update_adset': {
        const body: Record<string, unknown> = {};
        if (args.name)            body['name']            = args.name;
        if (args.status)          body['status']          = args.status;
        if (args.daily_budget)    body['daily_budget']    = args.daily_budget;
        if (args.lifetime_budget) body['lifetime_budget'] = args.lifetime_budget;
        if (args.end_time)        body['end_time']        = args.end_time;
        if (args.targeting)       body['targeting']       = args.targeting;
        return ok(await client.post(`/${args.adset_id}`, body));
      }

      // ── Ads ──────────────────────────────────────────────────────────────
      case 'list_ads': {
        const fields = str(args.fields, 'id,name,status,adset_id,campaign_id,creative');
        const params: Record<string, string> = { fields, limit: str(args.limit, '25') };
        if (args.status) params['effective_status'] = `["${args.status}"]`;

        const parent = args.adset_id ?? args.campaign_id ?? args.account_id;
        if (!parent) throw new Error('Provide adset_id, campaign_id, or account_id');
        return ok(await client.get(`/${parent}/ads`, params));
      }

      case 'get_ad': {
        const fields = str(args.fields, 'id,name,status,adset_id,campaign_id,creative,tracking_specs,conversion_specs');
        return ok(await client.get(`/${args.ad_id}`, { fields }));
      }

      case 'update_ad': {
        const body: Record<string, unknown> = {};
        if (args.name)   body['name']   = args.name;
        if (args.status) body['status'] = args.status;
        return ok(await client.post(`/${args.ad_id}`, body));
      }

      // ── Insights ─────────────────────────────────────────────────────────
      case 'get_insights': {
        const fields      = str(args.fields, 'impressions,clicks,spend,ctr,cpc,reach,frequency,actions');
        const level       = str(args.level, 'campaign');
        const date_preset = str(args.date_preset, 'last_30_days');
        const params: Record<string, string> = { fields, level, limit: str(args.limit, '25') };

        if (args.time_range) {
          params['time_range'] = JSON.stringify(args.time_range);
        } else {
          params['date_preset'] = date_preset;
        }

        if (args.breakdowns) params['breakdowns'] = str(args.breakdowns);
        return ok(await client.get(`/${args.object_id}/insights`, params));
      }

      default:
        return err(new Error(`Unknown tool: ${name}`));
    }
  } catch (e) {
    return err(e);
  }
}
