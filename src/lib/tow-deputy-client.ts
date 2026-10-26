import 'server-only';

const CLIENT_ID = 'pricing-portal';
const CALLBACK_URL = 'https://pricing.towdeputy.com/auth/tow-deputy/callback';
const ALLOWED_TD_ORIGINS = new Set(['https://towdeputy.com']);

type ValidRole = 'data_user' | 'merchant' | 'admin';

type ValidatedSession = { userId: string; role: ValidRole };

function getOrigin(): string {
  const origin = process.env.TOW_DEPUTY_ORIGIN;
  if (!origin || !ALLOWED_TD_ORIGINS.has(origin)) throw new Error('Tow Deputy origin is not configured.');
  return origin;
}

function getAuthorizationHeader(): string {
  const secret = process.env.TOW_DEPUTY_PORTAL_CLIENT_SECRET;
  if (!secret) throw new Error('Tow Deputy client secret is not configured.');
  return `Basic ${Buffer.from(`${CLIENT_ID}:${secret}`).toString('base64')}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function postForm(path: string, values: Record<string, string>): Promise<Response> {
  return fetch(`${getOrigin()}${path}`, {
    method: 'POST',
    headers: { Authorization: getAuthorizationHeader(), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(values),
    cache: 'no-store',
  });
}

export class TowDeputyBillingError extends Error {
  constructor(public readonly status: number) {
    super('Tow Deputy billing request failed.');
  }
}

/**
 * Server-only adapter for the frozen pricing billing contract.  It never
 * forwards browser cookies, query parameters, or browser authorization.
 */
export async function postPricingBilling(
  path: '/api/pricing/portal/billing/offers' | '/api/pricing/portal/billing/checkout' | '/api/pricing/portal/billing/access' | '/api/pricing/portal/billing/portal',
  sessionToken: string,
  values: Record<string, string> = {}
): Promise<unknown> {
  const response = await postForm(path, { session_token: sessionToken, ...values });
  if (!response.ok) throw new TowDeputyBillingError(response.status);
  return response.json() as Promise<unknown>;
}

export function getTowDeputyAuthorizeUrl(state: string): string {
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(state)) throw new Error('Invalid authorization state.');
  const url = new URL('/api/pricing/portal/authorize', getOrigin());
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('redirect_uri', CALLBACK_URL);
  url.searchParams.set('state', state);
  return url.toString();
}

export async function exchangeTowDeputyCode(code: string): Promise<string | null> {
  if (!code || code.length > 2048) return null;
  try {
    const response = await postForm('/api/pricing/portal/token', { code, redirect_uri: CALLBACK_URL });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    return isRecord(body) && typeof body.access_token === 'string' && body.access_token.length > 0
      ? body.access_token
      : null;
  } catch {
    return null;
  }
}

export async function validateTowDeputySession(token: string): Promise<ValidatedSession | null> {
  if (!token || token.length > 4096) return null;
  try {
    const response = await postForm('/api/pricing/portal/session/validate', { session_token: token });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    if (!isRecord(body) || typeof body.user_id !== 'string') return null;
    if (body.role !== 'data_user' && body.role !== 'merchant' && body.role !== 'admin') return null;
    return { userId: body.user_id, role: body.role };
  } catch {
    return null;
  }
}

export async function revokeTowDeputySession(token: string): Promise<boolean> {
  if (!token || token.length > 4096) return false;
  try {
    return (await postForm('/api/pricing/portal/session/revoke', { session_token: token })).ok;
  } catch {
    return false;
  }
}
