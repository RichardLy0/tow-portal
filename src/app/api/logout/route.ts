import { NextResponse } from 'next/server';
import { clearPortalCookies, getPortalToken } from '@/lib/portal-auth';
import { revokeTowDeputySession } from '@/lib/tow-deputy-client';

export async function POST() {
  const token = await getPortalToken();
  const revoked = token ? await revokeTowDeputySession(token) : true;
  const response = NextResponse.json(
    revoked
      ? { localSignedOut: true, remoteRevocationConfirmed: true }
      : {
          localSignedOut: true,
          remoteRevocationConfirmed: false,
          error: 'Signed out locally; remote session revocation could not be confirmed.',
        },
    { status: revoked ? 200 : 502 }
  );
  clearPortalCookies(response);
  return response;
}
