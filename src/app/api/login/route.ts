import { NextResponse } from 'next/server';
import { getRole } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const role = getRole(password);

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Incorrect password. Please try again.' },
        { status: 401 }
      );
    }

    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    };

    const response = NextResponse.json({ success: true });
    response.cookies.set('tow_portal_auth', 'authenticated', cookieOpts);
    response.cookies.set('tow_portal_role', role, cookieOpts);
    return response;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request.' }, { status: 400 });
  }
}
