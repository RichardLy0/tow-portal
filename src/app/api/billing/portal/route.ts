import { NextResponse } from 'next/server';
import { createPricingPortal } from '@/lib/pricing-billing';
import { TowDeputyBillingError } from '@/lib/tow-deputy-client';

export async function POST() {
  try {
    return NextResponse.json({ portal_url: await createPricingPortal() });
  } catch (error) {
    if (error instanceof TowDeputyBillingError && error.status === 401) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Billing portal is temporarily unavailable.' }, { status: 502 });
  }
}
