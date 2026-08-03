'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import type { Business } from '@/types';
import InfoPanel from './InfoPanel';
import ParametersBanner from './ParametersBanner';

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[#060d1a]">
      <div className="text-center">
        <svg className="w-10 h-10 animate-spin text-amber-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-slate-400 text-sm">Loading map…</p>
      </div>
    </div>
  ),
});

type LoadState = 'idle' | 'loading' | 'success' | 'error';

export default function MapDashboard() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [cityFilter, setCityFilter] = useState<string>('all');
  const router = useRouter();

  useEffect(() => {
    setLoadState('loading');
    fetch('/api/businesses')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<Business[]>;
      })
      .then((data) => {
        setBusinesses(data);
        setLoadState('success');
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg(
          'Could not load competitor data. Please ensure the geocoding script has been run.'
        );
        setLoadState('error');
      });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const handleMarkerClick = useCallback((business: Business) => {
    setSelectedBusiness(business);
  }, []);

  const handlePanelClose = useCallback(() => {
    setSelectedBusiness(null);
  }, []);

  // Get unique cities for filter
  const cities = Array.from(new Set(businesses.map((b) => b.cityState))).filter(Boolean).sort();

  const filteredBusinesses =
    cityFilter === 'all'
      ? businesses
      : businesses.filter((b) => b.cityState === cityFilter);

  const validCount = filteredBusinesses.filter((b) => b.lat !== null).length;
  const totalCount = filteredBusinesses.length;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#060d1a]">
      {/* Top navigation bar */}
      <header
        className="absolute top-0 left-0 right-0 z-[1001] flex items-center justify-between px-5 py-3"
        style={{
          background: 'linear-gradient(180deg, rgba(6,13,26,0.98) 0%, rgba(6,13,26,0) 100%)',
          pointerEvents: 'none',
        }}
      >
        <div className="flex items-center gap-3" style={{ pointerEvents: 'auto' }}>
          {/* Logo */}
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-[#060d1a]" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              <path d="M3 4a1 1 0 00-1 1v7a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h3a1 1 0 00.8-.4l2-2.667A1 1 0 0017 7h-3V5a1 1 0 00-1-1H3z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">Tow Deputy</p>
            <p className="text-xs text-slate-500 leading-none mt-0.5">Competitor Intel</p>
          </div>
        </div>

        <div className="flex items-center gap-3" style={{ pointerEvents: 'auto' }}>
          {/* Stats pill */}
          {loadState === 'success' && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>
                <strong className="text-white">{validCount}</strong> mapped
                {totalCount !== validCount && (
                  <> · {totalCount - validCount} pending geocode</>
                )}
              </span>
            </div>
          )}

          {/* City filter */}
          {cities.length > 1 && (
            <select
              value={cityFilter}
              onChange={(e) => {
                setCityFilter(e.target.value);
                setSelectedBusiness(null);
              }}
              className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white focus:outline-none focus:border-amber-500/50 cursor-pointer"
              style={{ background: '#1e2d42' }}
            >
              <option value="all">All Cities ({businesses.length})</option>
              {cities.map((city) => {
                const count = businesses.filter((b) => b.cityState === city).length;
                return (
                  <option key={city} value={city}>
                    {city} ({count})
                  </option>
                );
              })}
            </select>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-400 hover:text-white transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </header>

      {/* Map */}
      {loadState !== 'error' && (
        <LeafletMap
          businesses={filteredBusinesses}
          selectedId={selectedBusiness?.id ?? null}
          onMarkerClick={handleMarkerClick}
        />
      )}

      {/* Parameters banner */}
      {loadState === 'success' && <ParametersBanner />}

      {/* Loading overlay */}
      {loadState === 'loading' && (
        <div className="absolute inset-0 z-[1002] flex items-center justify-center bg-[#060d1a]/80">
          <div className="text-center">
            <svg className="w-10 h-10 animate-spin text-amber-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-white font-semibold mb-1">Loading Competitor Data</p>
            <p className="text-slate-400 text-sm">Fetching pricing intelligence…</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {loadState === 'error' && (
        <div className="absolute inset-0 z-[1002] flex items-center justify-center p-6">
          <div
            className="max-w-md w-full rounded-2xl p-8 text-center border border-red-500/20"
            style={{ background: 'rgba(20,32,52,0.95)' }}
          >
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Data Not Found</h3>
            <p className="text-slate-400 text-sm mb-6">{errorMsg}</p>
            <div
              className="rounded-xl p-4 text-left text-xs font-mono text-slate-300 border border-white/8"
              style={{ background: 'rgba(0,0,0,0.4)' }}
            >
              <p className="text-slate-500 mb-1"># Run from tow-portal directory:</p>
              <p className="text-amber-400">node scripts/geocode.mjs</p>
            </div>
          </div>
        </div>
      )}

      {/* Info panel */}
      <InfoPanel business={selectedBusiness} onClose={handlePanelClose} />
    </div>
  );
}
