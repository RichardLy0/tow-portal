import { NextResponse } from 'next/server';
import { createPortalState, PORTAL_STATE_COOKIE, stateCookieOptions } from '@/lib/portal-auth';
import { getTowDeputyAuthorizeUrl } from '@/lib/tow-deputy-client';

export async function GET() {
  try {
    const { nonce, value } = createPortalState();
    const response = NextResponse.redirect(getTowDeputyAuthorizeUrl(nonce));
    response.cookies.set(PORTAL_STATE_COOKIE, value, stateCookieOptions);
    return response;
  } catch {
    return NextResponse.json({ error: 'Authentication is temporarily unavailable.' }, { status: 503 });
  }
}
