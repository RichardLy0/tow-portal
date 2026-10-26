import { redirect } from 'next/navigation';
import CheckoutReturn from '@/components/CheckoutReturn';
import { getPortalSession } from '@/lib/portal-auth';

export default async function CheckoutReturnPage() {
  if (!await getPortalSession()) redirect('/login');
  return <CheckoutReturn />;
}
