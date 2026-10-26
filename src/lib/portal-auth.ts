import 'server-only';

import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import { validateTowDeputySession } from '@/lib/tow-deputy-client';

// This opaque Tow Deputy session token is intentionally only available to this host's server.
export const PORTAL_TOKEN_COOKIE = 'pricing_portal';
export const PORTAL_STATE_COOKIE = 'td_portal_state';

const STATE_TTL_SECONDS = 5 * 60;
const PORTAL_TTL_SECONDS = 24 * 60 * 60;

export const stateCookieOptions = { httpOnly: true, secure: true, sameSite: 'lax' as const, path: '/', maxAge: STATE_TTL_SECONDS };
export const portalTokenCookieOptions = { httpOnly: true, secure: true, sameSite: 'lax' as const, path: '/', maxAge: PORTAL_TTL_SECONDS };

function getStateSecret(): string {
  const secret = process.env.PORTAL_STATE_SECRET;
  if (!secret || secret.length < 32) throw new Error('PORTAL_STATE_SECRET is not configured.');
  return secret;
}

function sign(payload: string): string {
  return createHmac('sha256', getStateSecret()).update(payload).digest('base64url');
}

export function createPortalState(): { nonce: string; value: string } {
  const nonce = randomBytes(32).toString('base64url');
  const expiresAt = Date.now() + STATE_TTL_SECONDS * 1000;
  const payload = `${nonce}.${expiresAt}`;
  return { nonce, value: `${payload}.${sign(payload)}` };
}

export function verifyPortalState(value: string | undefined, returnedState: string): boolean {
  if (!value || !/^[A-Za-z0-9_-]{32,128}$/.test(returnedState)) return false;
  const parts = value.split('.');
  if (parts.length !== 3) return false;
  const [nonce, expiresAtText, signature] = parts;
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(nonce) || !/^\d{13}$/.test(expiresAtText)) return false;
  const actual = Buffer.from(signature);
  const expected = Buffer.from(sign(`${nonce}.${expiresAtText}`));
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;
  if (Number(expiresAtText) < Date.now()) return false;
  const actualNonce = Buffer.from(returnedState);
  const expectedNonce = Buffer.from(nonce);
  return actualNonce.length === expectedNonce.length && timingSafeEqual(actualNonce, expectedNonce);
}

export async function getPortalToken(): Promise<string | null> {
  const token = (await cookies()).get(PORTAL_TOKEN_COOKIE)?.value;
  return token && token.length <= 4096 ? token : null;
}

export async function getPortalSession() {
  const token = await getPortalToken();
  return token ? validateTowDeputySession(token) : null;
}

export function clearPortalCookies(response: NextResponse): void {
  const clear = { httpOnly: true, secure: true, sameSite: 'lax' as const, path: '/', maxAge: 0 };
  response.cookies.set(PORTAL_TOKEN_COOKIE, '', clear);
  response.cookies.set(PORTAL_STATE_COOKIE, '', clear);
}
