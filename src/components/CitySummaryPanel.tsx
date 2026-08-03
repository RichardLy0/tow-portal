'use client';

import { useState } from 'react';
import type { Business } from '@/types';

interface CitySummaryPanelProps {
  city: string;
  businesses: Business[];
}

interface StatResult {
  avg: number;
  min: number;
  max: number;
  n: number;
}

function calcStats(values: (number | null)[]): StatResult | null {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length === 0) return null;
  const sum = valid.reduce((a, b) => a + b, 0);
  return {
    avg: sum / valid.length,
    min: Math.min(...valid),
    max: Math.max(...valid),
    n: valid.length,
  };
}

function fmt(n: number, decimals = 0): string {
  return `$${n.toFixed(decimals)}`;
}

export default function CitySummaryPanel({ city, businesses }: CitySummaryPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  const quoteStats = calcStats(businesses.map((b) => b.totalQuote));
  const hookupStats = calcStats(businesses.map((b) => b.hookupFee));
  const mileStats = calcStats(businesses.map((b) => b.pricePerMile));

  if (!quoteStats && !hookupStats && !mileStats) return null;

  return (
    <div
      className="absolute bottom-4 left-4 z-[1001] w-[calc(100vw-2rem)] max-w-sm transition-all duration-300"
      style={{ touchAction: 'none' }}
    >
      <div
        className="rounded-2xl border border-amber-500/25 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(20,32,52,0.97) 0%, rgba(12,18,32,0.97) 100%)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,158,11,0.08)',
        }}
      >
        {/* Header */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-between px-4 py-3 text-left"
          style={{ touchAction: 'manipulation' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-400 truncate">
              {city}
            </span>
            <span className="text-xs text-slate-500 flex-shrink-0">
              · {businesses.length} businesses
            </span>
          </div>
          <svg
            className={`w-4 h-4 text-slate-400 flex-shrink-0 ml-2 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>

        {/* Stats grid */}
        {!collapsed && (
          <div className="px-4 pb-4 border-t border-white/5 pt-3 grid grid-cols-3 gap-2">
            <StatCard label="Total Quote" stat={quoteStats} decimals={0} />
            <StatCard label="Hookup Fee" stat={hookupStats} decimals={0} />
            <StatCard label="Per Mile" stat={mileStats} decimals={2} />
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, stat, decimals }: { label: string; stat: StatResult | null; decimals: number }) {
  if (!stat) {
    return (
      <div className="rounded-xl p-3 bg-white/4 border border-white/8 text-center">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">{label}</p>
        <p className="text-xs text-slate-600 italic">No data</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-3 bg-white/4 border border-white/8">
      <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2 leading-tight">{label}</p>

      {/* Average — hero */}
      <p className="text-lg font-black text-amber-400 leading-none">{fmt(stat.avg, decimals)}</p>
      <p className="text-xs text-slate-500 mb-2">avg · n={stat.n}</p>

      {/* Min / Max */}
      <div className="flex justify-between gap-1 text-xs">
        <div className="text-center flex-1">
          <p className="text-slate-500 leading-none mb-0.5">Min</p>
          <p className="font-semibold text-green-400">{fmt(stat.min, decimals)}</p>
        </div>
        <div className="w-px bg-white/10" />
        <div className="text-center flex-1">
          <p className="text-slate-500 leading-none mb-0.5">Max</p>
          <p className="font-semibold text-red-400">{fmt(stat.max, decimals)}</p>
        </div>
      </div>
    </div>
  );
}
