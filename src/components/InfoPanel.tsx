'use client';

import type { Business } from '@/types';

interface InfoPanelProps {
  business: Business | null;
  onClose: () => void;
}

function fmt(value: number | null, prefix = '$'): string {
  if (value === null || value === undefined) return '—';
  return `${prefix}${value.toFixed(2)}`;
}

function fmtDate(raw: string): string {
  if (!raw) return raw;
  // Normalize separator variants: dots, dashes, slashes → parts
  const parts = raw.trim().split(/[.\-\/]/);
  if (parts.length === 3) {
    const [m, d, y] = parts;
    return `${m.padStart(2, '0')}/${d.padStart(2, '0')}/${y}`;
  }
  return raw;
}

export default function InfoPanel({ business, onClose }: InfoPanelProps) {
  const visible = business !== null;

  return (
    <>
      {/* Backdrop for mobile */}
      {visible && (
        <div
          className="absolute inset-0 z-[999] md:hidden bg-black/40"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`
          absolute top-0 right-0 bottom-0 z-[1000]
          w-full md:w-96
          transition-transform duration-300 ease-in-out
          ${visible ? 'translate-x-0' : 'translate-x-full'}
        `}
        style={{
          background: 'linear-gradient(180deg, rgba(20,32,52,0.99) 0%, rgba(12,18,32,0.99) 100%)',
          backdropFilter: 'blur(24px)',
          borderLeft: '1px solid rgba(245,158,11,0.15)',
          boxShadow: '-16px 0 48px rgba(0,0,0,0.5)',
        }}
      >
        {business && (
          <div className="h-full flex flex-col overflow-hidden">
            {/* Panel header */}
            <div className="px-6 pt-6 pb-4 border-b border-white/8 flex-shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                      Competitor
                    </span>
                    {business.cityState && (
                      <span className="text-xs text-slate-500">{business.cityState}</span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-white leading-tight">{business.name}</h2>
                  {business.address && (
                    <p className="text-sm text-slate-400 mt-1 leading-snug">{business.address}</p>
                  )}
                  {business.phone && (
                    <p className="text-sm text-amber-400/80 mt-1 font-mono">{business.phone}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-slate-400 hover:text-white transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Pricing cards */}
            <div className="px-6 py-5 flex-shrink-0">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
                Quote Breakdown
              </h3>

              {/* Total Quote — hero stat */}
              {business.totalQuote !== null ? (
                <div
                  className="rounded-2xl p-5 mb-4 text-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(217,119,6,0.08) 100%)',
                    border: '1px solid rgba(245,158,11,0.25)',
                  }}
                >
                  <p className="text-xs text-amber-400/70 uppercase tracking-widest mb-1 font-medium">Total Quote Given</p>
                  <p className="text-4xl font-black text-amber-400">{fmt(business.totalQuote)}</p>
                  <p className="text-xs text-slate-500 mt-1">Normalized light-duty tow scenario</p>
                </div>
              ) : (
                <div className="rounded-2xl p-4 mb-4 text-center bg-white/3 border border-white/8">
                  <p className="text-slate-500 text-sm">No total quote recorded</p>
                </div>
              )}

              {/* Hook fee + Per mile grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <PriceCard
                  label="Hookup Fee"
                  value={fmt(business.hookupFee)}
                  hasData={business.hookupFee !== null}
                  icon="🪝"
                />
                <PriceCard
                  label="Per Mile"
                  value={fmt(business.pricePerMile)}
                  hasData={business.pricePerMile !== null}
                  icon="📏"
                />
              </div>

              {/* Distance info */}
              {(business.distanceMi !== null || business.loadedDistanceMi !== null) && (
                <div className="grid grid-cols-2 gap-3">
                  {business.distanceMi !== null && (
                    <DataChip label="En Route" value={`${business.distanceMi} mi`} />
                  )}
                  {business.loadedDistanceMi !== null && (
                    <DataChip label="Loaded" value={`${business.loadedDistanceMi} mi`} />
                  )}
                </div>
              )}
            </div>

            {/* Notes */}
            {business.notes && (
              <div className="px-6 pb-4 flex-shrink-0">
                <div className="rounded-xl p-4 bg-white/3 border border-white/8">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Notes</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{business.notes}</p>
                </div>
              </div>
            )}

            {/* Date called footer */}
            {business.dateCalled && (
              <div className="mt-auto px-6 py-4 border-t border-white/6 flex-shrink-0">
                <p className="text-sm text-slate-300 text-center font-medium"
                  style={{
                    background: 'rgba(245,158,11,0.08)',
                    border: '1px solid rgba(245,158,11,0.25)',
                    borderRadius: '10px',
                    padding: '8px 12px',
                  }}
                >
                  📅 Quote collected on{' '}
                  <span className="text-amber-400 font-bold">{fmtDate(business.dateCalled)}</span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function PriceCard({
  label,
  value,
  hasData,
  icon,
}: {
  label: string;
  value: string;
  hasData: boolean;
  icon: string;
}) {
  return (
    <div className="rounded-xl p-3.5 bg-white/4 border border-white/8">
      <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">
        {icon} {label}
      </p>
      {hasData ? (
        <p className="text-xl font-bold text-white">{value}</p>
      ) : (
        <p className="text-sm text-slate-500 italic">Quote Only</p>
      )}
    </div>
  );
}

function DataChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/3 border border-white/6">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-semibold text-slate-300">{value}</span>
    </div>
  );
}
