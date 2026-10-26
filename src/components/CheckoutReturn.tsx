'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

const MAX_REFRESHES = 3;

export default function CheckoutReturn() {
  const [refreshes, setRefreshes] = useState(0);
  const [message, setMessage] = useState('Checking your market access with Tow Deputy…');

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/billing/access', { cache: 'no-store' });
      if (response.status === 401) {
        setMessage('Your session has expired. Please sign in again.');
        return;
      }
      if (!response.ok) throw new Error();
      setMessage('Access refreshed. Purchases may take a moment to appear; review the current status on your dashboard.');
    } catch {
      setMessage('We could not refresh access right now. You can try again or return to the dashboard.');
    }
  }, []);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => void refresh(), 0);
    const timers = Array.from({ length: MAX_REFRESHES - 1 }, (_, index) => window.setTimeout(() => {
      setRefreshes(index + 1);
      void refresh();
    }, (index + 1) * 2000));
    return () => {
      window.clearTimeout(initialRefresh);
      timers.forEach(window.clearTimeout);
    };
  }, [refresh]);

  return <main className="flex min-h-screen items-center justify-center bg-[#060d1a] p-6 text-white"><section className="max-w-lg rounded-2xl border border-white/10 bg-white/5 p-8"><h1 className="text-2xl font-bold">Checkout return</h1><p className="mt-3 text-slate-300">{message}</p><p className="mt-3 text-sm text-slate-400">This return does not confirm a purchase or grant access. Only Tow Deputy&apos;s current access response does that.</p><div className="mt-6 flex gap-3"><button type="button" onClick={() => void refresh()} className="rounded-lg border border-amber-400 px-4 py-2 font-semibold text-amber-300">Refresh now</button><Link href="/dashboard" className="rounded-lg bg-amber-400 px-4 py-2 font-semibold text-slate-950">View dashboard</Link></div>{refreshes > 0 && <p className="mt-3 text-xs text-slate-500">Automatic refresh {refreshes} of {MAX_REFRESHES - 1}</p>}</section></main>;
}
