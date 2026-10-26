'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PricingAccess, PricingOffer } from '@/types/pricing-billing';

function isPricingOffer(value: unknown): value is PricingOffer {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return typeof item.market_id === 'string' && typeof item.price_id === 'string' && typeof item.name === 'string'
    && typeof item.unit_amount === 'number' && Number.isSafeInteger(item.unit_amount) && item.unit_amount >= 0;
}

function isPricingAccess(value: unknown): value is PricingAccess {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return typeof item.market_id === 'string' && typeof item.active === 'boolean';
}

async function getBillingData(key: 'offers'): Promise<PricingOffer[]>;
async function getBillingData(key: 'access'): Promise<PricingAccess[]>;
async function getBillingData(key: 'offers' | 'access'): Promise<PricingOffer[] | PricingAccess[]> {
  const response = await fetch(`/api/billing/${key}`, { cache: 'no-store' });
  if (response.status === 401) throw new Error('Your session has expired. Please sign in again.');
  const body: unknown = await response.json();
  if (!response.ok || typeof body !== 'object' || body === null) {
    throw new Error('Pricing Intelligence is temporarily unavailable.');
  }
  const values = (body as Record<string, unknown>)[key];
  if (!Array.isArray(values)) throw new Error('Pricing Intelligence is temporarily unavailable.');
  if (key === 'offers') {
    if (!values.every(isPricingOffer)) throw new Error('Pricing Intelligence is temporarily unavailable.');
    return values;
  }
  if (!values.every(isPricingAccess)) throw new Error('Pricing Intelligence is temporarily unavailable.');
  return values;
}

export default function PricingIntelligence() {
  const [offers, setOffers] = useState<PricingOffer[]>([]);
  const [access, setAccess] = useState<PricingAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [offerRecords, accessRecords] = await Promise.all([getBillingData('offers'), getBillingData('access')]);
      setOffers(offerRecords);
      setAccess(accessRecords);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Pricing Intelligence is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(initialRefresh);
  }, [refresh]);

  const activeAccess = useMemo(() => access.filter((item) => item.active), [access]);
  const entitledMarketIds = useMemo(() => new Set(activeAccess.map((item) => item.market_id)), [activeAccess]);
  const availableOffers = offers.filter((offer) => !entitledMarketIds.has(offer.market_id));

  async function startCheckout(offer: PricingOffer) {
    setBusy(`${offer.market_id}:${offer.price_id}`);
    setMessage(null);
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_id: offer.price_id, market_id: offer.market_id }),
      });
      const body: unknown = await response.json();
      if (!response.ok || typeof body !== 'object' || body === null || typeof (body as Record<string, unknown>).checkout_url !== 'string') {
        throw new Error(response.status === 401 ? 'Your session has expired. Please sign in again.' : 'Checkout is temporarily unavailable.');
      }
      window.location.assign((body as { checkout_url: string }).checkout_url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Checkout is temporarily unavailable.');
    } finally {
      setBusy(null);
    }
  }

  async function openBillingPortal() {
    setBusy('portal');
    setMessage(null);
    try {
      const response = await fetch('/api/billing/portal', { method: 'POST' });
      const body: unknown = await response.json();
      if (!response.ok || typeof body !== 'object' || body === null || typeof (body as Record<string, unknown>).portal_url !== 'string') {
        throw new Error(response.status === 401 ? 'Your session has expired. Please sign in again.' : 'Billing portal is temporarily unavailable.');
      }
      window.location.assign((body as { portal_url: string }).portal_url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Billing portal is temporarily unavailable.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#060d1a] p-6 text-white sm:p-10">
      <section className="mx-auto max-w-4xl space-y-8">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-400">Tow Deputy</p>
            <h1 className="mt-1 text-3xl font-bold">Pricing Intelligence</h1>
            <p className="mt-2 text-slate-300">Manage your currently entitled markets and purchase additional available markets.</p>
          </div>
          <button type="button" onClick={() => void openBillingPortal()} disabled={busy !== null} className="rounded-lg border border-amber-400 px-4 py-2 font-semibold text-amber-300 disabled:opacity-50">
            {busy === 'portal' ? 'Opening…' : 'Manage billing'}
          </button>
        </header>

        {message && <p role="alert" className="rounded-lg border border-red-400/40 bg-red-950/40 p-4 text-red-100">{message}</p>}

        <section aria-labelledby="current-markets">
          <div className="flex items-center justify-between gap-4">
            <h2 id="current-markets" className="text-xl font-bold">Current entitled markets</h2>
            <button type="button" onClick={() => void refresh()} disabled={loading || busy !== null} className="text-sm font-semibold text-amber-300 underline disabled:opacity-50">
              {loading ? 'Refreshing…' : 'Refresh access'}
            </button>
          </div>
           {!loading && activeAccess.length === 0 ? (
            <p className="mt-3 rounded-lg border border-white/10 bg-white/5 p-4 text-slate-300">No entitled markets are currently reported by Tow Deputy.</p>
          ) : (
             <ul className="mt-3 grid gap-3 sm:grid-cols-2">{activeAccess.map((item) => <li key={item.market_id} className="rounded-lg border border-white/10 bg-white/5 p-4"><strong>{item.market_id}</strong><p className="mt-1 text-sm text-slate-300">Pricing Intelligence access</p></li>)}</ul>
          )}
        </section>

        <section aria-labelledby="available-markets">
          <h2 id="available-markets" className="text-xl font-bold">Additional markets</h2>
          {!loading && availableOffers.length === 0 ? (
            <p className="mt-3 rounded-lg border border-white/10 bg-white/5 p-4 text-slate-300">No additional market offers are currently available.</p>
          ) : (
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">{availableOffers.map((offer) => <li key={`${offer.market_id}:${offer.price_id}`} className="rounded-lg border border-white/10 bg-white/5 p-4"><h3 className="font-bold">{offer.name}</h3><p className="mt-1 text-amber-300">{offer.unit_amount} cents</p><p className="mt-2 text-sm text-slate-300">Pricing Intelligence</p><button type="button" onClick={() => void startCheckout(offer)} disabled={busy !== null} className="mt-4 rounded-lg bg-amber-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-50">{busy === `${offer.market_id}:${offer.price_id}` ? 'Opening…' : 'Purchase market'}</button></li>)}</ul>
          )}
        </section>
      </section>
    </main>
  );
}
