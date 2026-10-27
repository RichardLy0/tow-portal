import { redirect } from 'next/navigation';
import AdminPricing from '@/components/AdminPricing';
import { requireFreshAdmin } from '@/lib/pricing-admin';

export default async function AdminPricingPage() {
  const gate = await requireFreshAdmin();
  if ('status' in gate) {
    if (gate.status === 401) redirect('/login');
    return <main className="min-h-screen bg-[#060d1a] p-8 text-white"><h1 className="text-2xl font-bold">Access denied</h1><p className="mt-2 text-slate-300">Administrator access is required.</p></main>;
  }
  return <AdminPricing />;
}
