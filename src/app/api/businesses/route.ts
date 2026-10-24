import { NextResponse } from 'next/server';
import { getPortalSession } from '@/lib/portal-auth';

export async function GET() {
  if (!(await getPortalSession())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  return NextResponse.json(
    { error: 'Business data is unavailable until PORTAL-02 authorization controls are complete.' },
    { status: 503 }
  );
}
