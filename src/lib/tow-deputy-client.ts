import 'server-only';

import { getPortalOrigin, getTowDeputyOrigin } from '@/lib/origins';

const CLIENT_ID = 'pricing-portal';

type ValidRole = 'data_user' | 'merchant' | 'admin';

type ValidatedSession = { userId: string; role: ValidRole };

function getCallbackUrl(): string {
  return new URL('/auth/tow-deputy/callback', getPortalOrigin()).toString();
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
  return fetch(`${getTowDeputyOrigin()}${path}`, {
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

export type PricingAdminOperation =
  | 'markets/list' | 'markets/create' | 'markets/update' | 'markets/archive'
  | 'observations/list' | 'observations/markets/replace'
  | 'modeled-prices/list' | 'modeled-prices/read' | 'modeled-prices/markets/replace';

const PRICING_ADMIN_OPERATIONS = new Set<PricingAdminOperation>([
  'markets/list', 'markets/create', 'markets/update', 'markets/archive',
  'observations/list', 'observations/markets/replace',
  'modeled-prices/list', 'modeled-prices/read', 'modeled-prices/markets/replace',
]);

export class TowDeputyAdminError extends Error {
  constructor(public readonly status: number) {
    super('Tow Deputy admin request failed.');
  }
}

/** Fixed-contract server adapter. The operation is allowlisted; no browser URL or credential is forwarded. */
export async function postPricingAdmin(
  operation: PricingAdminOperation,
  sessionToken: string,
  values: URLSearchParams = new URLSearchParams(),
): Promise<unknown> {
  if (!PRICING_ADMIN_OPERATIONS.has(operation)) throw new Error('Unsupported pricing admin operation.');
  values.set('session_token', sessionToken);
  const response = await fetch(`${getTowDeputyOrigin()}/api/pricing/portal/admin/${operation}`, {
    method: 'POST', headers: { Authorization: getAuthorizationHeader(), 'Content-Type': 'application/x-www-form-urlencoded' }, body: values, cache: 'no-store',
  });
  if (!response.ok) throw new TowDeputyAdminError(response.status);
  return response.json() as Promise<unknown>;
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
  const url = new URL('/api/pricing/portal/authorize', getTowDeputyOrigin());
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('redirect_uri', getCallbackUrl());
  url.searchParams.set('state', state);
  return url.toString();
}

export async function exchangeTowDeputyCode(code: string): Promise<string | null> {
  if (!code || code.length > 2048) return null;
  try {
    const response = await postForm('/api/pricing/portal/token', { code, redirect_uri: getCallbackUrl() });
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
