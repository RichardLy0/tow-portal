import { NextResponse } from 'next/server';

const PASSWORD = 'TowData2026';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    if (password === PASSWORD) {
      const response = NextResponse.json({ success: true });
      response.cookies.set('tow_portal_auth', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Incorrect password. Please try again.' },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request.' },
      { status: 400 }
    );
  }
}
