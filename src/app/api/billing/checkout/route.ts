import { NextRequest, NextResponse } from 'next/server';
import { createPricingCheckout } from '@/lib/pricing-billing';
import { TowDeputyBillingError } from '@/lib/tow-deputy-client';

const MARKET_ID = /^td-us-[a-z]{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 512;
}

function isCheckoutRequest(value: unknown): value is { price_id: string; market_id: string } {
  if (typeof value !== 'object' || value === null || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) return false;
  const body = value as Record<string, unknown>;
  const keys = Object.keys(body);
  return keys.length === 2
    && keys.includes('price_id')
    && keys.includes('market_id')
    && validId(body.price_id)
    && validId(body.market_id)
    && MARKET_ID.test(body.market_id);
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'price_id and market_id are required.' }, { status: 400 });
  }
  if (!isCheckoutRequest(body)) {
    return NextResponse.json({ error: 'price_id and market_id are required.' }, { status: 400 });
  }
  try {
    const { price_id, market_id } = body;
    return NextResponse.json({ checkout_url: await createPricingCheckout(price_id, market_id) });
  } catch (error) {
    if (error instanceof TowDeputyBillingError && error.status === 401) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Checkout is temporarily unavailable.' }, { status: 502 });
  }
}
