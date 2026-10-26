import { NextResponse } from 'next/server';
import { getPricingOffers } from '@/lib/pricing-billing';
import { TowDeputyBillingError } from '@/lib/tow-deputy-client';

export async function GET() {
  try {
    return NextResponse.json({ offers: await getPricingOffers() });
  } catch (error) {
    return billingError(error);
  }
}

function billingError(error: unknown) {
  if (error instanceof TowDeputyBillingError && error.status === 401) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  return NextResponse.json({ error: 'Pricing billing is temporarily unavailable.' }, { status: 502 });
}
