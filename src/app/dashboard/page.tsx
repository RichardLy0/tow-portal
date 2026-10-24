import { redirect } from 'next/navigation';
import { getPortalSession } from '@/lib/portal-auth';

export default async function DashboardPage() {
  const session = await getPortalSession();
  if (!session) redirect('/login');

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#060d1a] p-6 text-center text-white">
      <section className="max-w-lg rounded-2xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-2xl font-bold">Portal access confirmed</h1>
        <p className="mt-3 text-slate-300">
          Pricing intelligence is temporarily unavailable while its data authorization controls are completed.
        </p>
      </section>
    </main>
  );
}
