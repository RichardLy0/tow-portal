import { NextRequest, NextResponse } from 'next/server';
import {
  PORTAL_STATE_COOKIE,
  PORTAL_TOKEN_COOKIE,
  portalTokenCookieOptions,
  stateCookieOptions,
  verifyPortalState,
} from '@/lib/portal-auth';
import { exchangeTowDeputyCode } from '@/lib/tow-deputy-client';
import { getPortalOrigin } from '@/lib/origins';

function failedCallback(): NextResponse {
  const response = NextResponse.redirect(new URL('/login?error=authentication_failed', getPortalOrigin()));
  response.cookies.set(PORTAL_STATE_COOKIE, '', { ...stateCookieOptions, maxAge: 0 });
  return response;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const stateCookie = request.cookies.get(PORTAL_STATE_COOKIE)?.value;
  if (!code || !state || !verifyPortalState(stateCookie, state)) return failedCallback();

  const response = NextResponse.redirect(new URL('/dashboard', getPortalOrigin()));
  response.cookies.set(PORTAL_STATE_COOKIE, '', { ...stateCookieOptions, maxAge: 0 });
  const token = await exchangeTowDeputyCode(code);
  if (!token) return failedCallback();

  response.cookies.set(PORTAL_TOKEN_COOKIE, token, portalTokenCookieOptions);
  return response;
}
