import { NextResponse } from 'next/server';

export function proxy() {
  // Authorization occurs in server routes/components after TD validation.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
