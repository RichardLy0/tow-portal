import { NextResponse } from 'next/server';
import { getPricingAccess } from '@/lib/pricing-billing';
import { TowDeputyBillingError } from '@/lib/tow-deputy-client';

export async function GET() {
  try {
    return NextResponse.json({ access: await getPricingAccess() });
  } catch (error) {
    if (error instanceof TowDeputyBillingError && error.status === 401) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Pricing access is temporarily unavailable.' }, { status: 502 });
  }
}
