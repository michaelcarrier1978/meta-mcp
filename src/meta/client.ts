const META_BASE = 'https://graph.facebook.com/v21.0';

export class MetaApiError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
    public readonly fbType?: string,
  ) {
    super(message);
    this.name = 'MetaApiError';
  }
}

interface MetaErrorBody {
  error: { message: string; code: number; type: string };
}

export class MetaClient {
  constructor(private readonly accessToken: string) {}

  private async request<T>(
    path: string,
    {
      method = 'GET',
      params,
      body,
    }: { method?: string; params?: Record<string, string>; body?: unknown } = {},
  ): Promise<T> {
    const url = new URL(`${META_BASE}${path}`);
    url.searchParams.set('access_token', this.accessToken);
    for (const [k, v] of Object.entries(params ?? {})) {
      url.searchParams.set(k, v);
    }

    const res = await fetch(url.toString(), {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = (await res.json()) as T | MetaErrorBody;

    if ((json as MetaErrorBody).error) {
      const { message, code, type } = (json as MetaErrorBody).error;
      throw new MetaApiError(message, code, type);
    }

    return json as T;
  }

  get<T>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>(path, { params });
  }

  post<T>(path: string, body?: unknown, params?: Record<string, string>): Promise<T> {
    return this.request<T>(path, { method: 'POST', body, params });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

// Exchanges a short-lived code for a long-lived user access token.
export async function exchangeCodeForLongLivedToken(code: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const appId = process.env.META_APP_ID!;
  const appSecret = process.env.META_APP_SECRET!;
  const redirectUri = process.env.META_REDIRECT_URI!;

  // Step 1: code → short-lived token
  const shortRes = await fetch(
    `${META_BASE}/oauth/access_token?` +
      new URLSearchParams({ client_id: appId, client_secret: appSecret, redirect_uri: redirectUri, code }),
  );
  const shortData = (await shortRes.json()) as { access_token: string; error?: { message: string } };
  if (shortData.error) throw new MetaApiError(shortData.error.message);

  // Step 2: short-lived → long-lived (60-day)
  const longRes = await fetch(
    `${META_BASE}/oauth/access_token?` +
      new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: shortData.access_token,
      }),
  );
  const longData = (await longRes.json()) as { access_token: string; expires_in: number; error?: { message: string } };
  if (longData.error) throw new MetaApiError(longData.error.message);

  return { access_token: longData.access_token, expires_in: longData.expires_in };
}
