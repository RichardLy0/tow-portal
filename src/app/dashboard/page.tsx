import { redirect } from 'next/navigation';
import PricingIntelligence from '@/components/PricingIntelligence';
import { getPortalSession } from '@/lib/portal-auth';

export default async function DashboardPage() {
  const session = await getPortalSession();
  if (!session) redirect('/login');

  return <PricingIntelligence isAdmin={session.role === 'admin'} />;
}
