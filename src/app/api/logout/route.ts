import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  const clear = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' as const, path: '/', maxAge: 0 };
  response.cookies.set('tow_portal_auth', '', clear);
  response.cookies.set('tow_portal_role', '', clear);
  return response;
}
