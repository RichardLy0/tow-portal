'use client';

import { useState } from 'react';

export default function ParametersBanner() {
  // Collapsed by default on mobile screens
  const [collapsed, setCollapsed] = useState(
    typeof window !== 'undefined' && window.innerWidth < 768
  );

  return (
    <div
      className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-3xl px-4 transition-all duration-300"
    >
      <div
        className="rounded-2xl border border-amber-500/20 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(20,32,52,0.97) 0%, rgba(12,18,32,0.97) 100%)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,158,11,0.1)',
        }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-semibold tracking-widest uppercase text-amber-400">
              Standardized Quote Parameters
            </span>
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-400 hover:text-amber-400 transition-colors p-1 rounded"
            aria-label={collapsed ? 'Expand parameters' : 'Collapse parameters'}
          >
            <svg
              className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>

        {/* Parameter grid */}
        {!collapsed && (
          <div className="px-5 pb-4 border-t border-white/5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              <ParameterCard
                icon={<TruckIcon />}
                label="Vehicle Type"
                value="Light-Duty Tow"
                note="Standard 4-door sedan"
              />
              <ParameterCard
                icon={<RouteIcon />}
                label="En Route Distance"
                value="5 – 6 miles"
                note="From competitor yard to pickup"
              />
              <ParameterCard
                icon={<DistanceIcon />}
                label="Loaded Distance"
                value="7.4 – 8.5 miles"
                note="Pickup to drop-off"
              />
            </div>
            <p className="mt-3 text-xs text-slate-500 text-center">
              All quotes collected using a normalized, light-duty towing scenario to ensure apples-to-apples comparison across all markets.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ParameterCard({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-white/4 border border-white/6">
      <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-amber-400 w-4 h-4">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">{label}</p>
        <p className="text-sm font-bold text-white leading-tight">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{note}</p>
      </div>
    </div>
  );
}

function TruckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      <path d="M3 4a1 1 0 00-1 1v7a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h3a1 1 0 00.8-.4l2-2.667A1 1 0 0017 7h-3V5a1 1 0 00-1-1H3z" />
    </svg>
  );
}

function RouteIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <circle cx="4" cy="10" r="2.5" />
      <circle cx="16" cy="10" r="2.5" />
      <path d="M6.5 10h7" strokeDasharray="2 2" />
    </svg>
  );
}

function DistanceIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path d="M3 10l3-3m0 0l3 3m-3-3v8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 10l-3-3m0 0l-3 3m3-3v8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
