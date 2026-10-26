import 'server-only';

import { getPortalToken } from '@/lib/portal-auth';
import { postPricingBilling, TowDeputyBillingError } from '@/lib/tow-deputy-client';
import type { PricingAccess, PricingOffer } from '@/types/pricing-billing';

type PricingRecord = Record<string, unknown>;

const MARKET_ID = /^td-us-[a-z]{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CHECKOUT_HOSTS = new Set(['checkout.stripe.com']);
const PORTAL_HOSTS = new Set(['billing.stripe.com']);

function isRecord(value: unknown): value is PricingRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function tokenOrThrow(): Promise<string> {
  const token = await getPortalToken();
  if (!token) throw new TowDeputyBillingError(401);
  return token;
}

function isNonEmptyString(value: unknown, maxLength = 512): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

function hasOnlyKeys(record: PricingRecord, keys: readonly string[]): boolean {
  return Object.keys(record).every((key) => keys.includes(key));
}

function toOffer(value: unknown): PricingOffer | null {
  if (!isRecord(value) || !hasOnlyKeys(value, ['price_id', 'market_id', 'name', 'unit_amount'])) return null;
  if (!isNonEmptyString(value.price_id) || !isNonEmptyString(value.market_id) || !MARKET_ID.test(value.market_id)) return null;
  if (!isNonEmptyString(value.name, 256) || typeof value.unit_amount !== 'number' || !Number.isSafeInteger(value.unit_amount) || value.unit_amount < 0) return null;
  return {
    price_id: value.price_id,
    market_id: value.market_id,
    name: value.name,
    unit_amount: value.unit_amount,
  };
}

function toAccess(value: unknown): PricingAccess | null {
  if (!isRecord(value) || !hasOnlyKeys(value, ['market_id', 'active'])) return null;
  if (!isNonEmptyString(value.market_id) || !MARKET_ID.test(value.market_id) || typeof value.active !== 'boolean') return null;
  return { market_id: value.market_id, active: value.active };
}

async function arrayResponse<T>(
  path: '/api/pricing/portal/billing/offers' | '/api/pricing/portal/billing/access',
  project: (value: unknown) => T | null
): Promise<T[]> {
  const body = await postPricingBilling(path, await tokenOrThrow());
  if (!Array.isArray(body)) throw new TowDeputyBillingError(502);
  const projected = body.map(project);
  if (projected.some((value) => value === null)) throw new TowDeputyBillingError(502);
  return projected as T[];
}

export function getPricingOffers(): Promise<PricingOffer[]> {
  return arrayResponse('/api/pricing/portal/billing/offers', toOffer);
}

export function getPricingAccess(): Promise<PricingAccess[]> {
  return arrayResponse('/api/pricing/portal/billing/access', toAccess);
}

function validStripeHostedUrl(value: unknown, allowedHosts: ReadonlySet<string>): string | null {
  if (!isNonEmptyString(value, 4096)) return null;
  try {
    // WHATWG URL normalizes an explicit default port (for example, :443) to
    // an empty `port`, so inspect the raw authority before parsing.
    const authority = /^https:\/\/([^/?#]*)/i.exec(value)?.[1];
    const hostAndPort = authority?.slice(authority.lastIndexOf('@') + 1);
    if (!authority || hostAndPort?.includes(':')) return null;
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || !allowedHosts.has(url.hostname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function createPricingCheckout(priceId: string, marketId: string): Promise<string> {
  const body = await postPricingBilling('/api/pricing/portal/billing/checkout', await tokenOrThrow(), {
    price_id: priceId,
    market_id: marketId,
  });
  const checkoutUrl = isRecord(body) && Object.keys(body).length === 1 && hasOnlyKeys(body, ['checkout_url'])
    ? validStripeHostedUrl(body.checkout_url, CHECKOUT_HOSTS)
    : null;
  if (!checkoutUrl) {
    throw new TowDeputyBillingError(502);
  }
  return checkoutUrl;
}

export async function createPricingPortal(): Promise<string> {
  const body = await postPricingBilling('/api/pricing/portal/billing/portal', await tokenOrThrow());
  const portalUrl = isRecord(body) && Object.keys(body).length === 1 && hasOnlyKeys(body, ['portal_url'])
    ? validStripeHostedUrl(body.portal_url, PORTAL_HOSTS)
    : null;
  if (!portalUrl) {
    throw new TowDeputyBillingError(502);
  }
  return portalUrl;
}
