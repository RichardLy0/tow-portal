import 'server-only';

import { NextResponse } from 'next/server';
import { getPortalOrigin } from '@/lib/origins';

/**
 * Cookie-authenticated admin mutations must originate from the explicit portal
 * deployment origin. PORTAL_ORIGIN is a public deployment URL, never derived
 * from request headers.
 */
export function rejectUntrustedAdminMutation(request: Request): NextResponse | null {
  const origin = request.headers.get('origin');
  let trustedOrigin: string;
  try {
    trustedOrigin = getPortalOrigin();
  } catch {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }
  if (!origin || origin === 'null' || origin !== trustedOrigin || request.headers.get('sec-fetch-site') === 'cross-site') {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }
  return null;
}
