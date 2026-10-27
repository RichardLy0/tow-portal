import 'server-only';

import { getPortalToken, getPortalSession } from '@/lib/portal-auth';
import { postPricingAdmin, TowDeputyAdminError, type PricingAdminOperation } from '@/lib/tow-deputy-client';

export type AdminGate = { token: string } | { status: 401 | 403 };

/** Revalidates the opaque SSO session for every protected page and BFF request. */
export async function requireFreshAdmin(): Promise<AdminGate> {
  const token = await getPortalToken();
  if (!token) return { status: 401 };
  const session = await getPortalSession();
  return session?.role === 'admin' ? { token } : { status: session ? 403 : 401 };
}

export async function adminRequest(operation: PricingAdminOperation, values: URLSearchParams = new URLSearchParams()): Promise<unknown> {
  const gate = await requireFreshAdmin();
  if ('status' in gate) throw new AdminRequestError(gate.status);
  return postPricingAdmin(operation, gate.token, values);
}

export class AdminRequestError extends Error {
  constructor(public readonly status: number) { super('Pricing administration request failed.'); }
}

export function adminErrorStatus(error: unknown): 401 | 403 | 409 | 502 {
  if (error instanceof AdminRequestError && (error.status === 401 || error.status === 403)) return error.status;
  if (error instanceof TowDeputyAdminError && (error.status === 401 || error.status === 403 || error.status === 409)) return error.status;
  return 502;
}
