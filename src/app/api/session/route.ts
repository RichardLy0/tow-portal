import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const auth = cookieStore.get('tow_portal_auth');
  const role = cookieStore.get('tow_portal_role');

  if (auth?.value !== 'authenticated') {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const roleValue = role?.value ?? 'admin';
  return NextResponse.json({
    authenticated: true,
    isAdmin: roleValue === 'admin',
    city: roleValue === 'admin' ? null : roleValue,
  });
}
