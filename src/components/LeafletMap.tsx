'use client';

import { useEffect, useRef, useState } from 'react';
import type { Business } from '@/types';

interface LeafletMapProps {
  businesses: Business[];
  selectedId: string | null;
  onMarkerClick: (business: Business) => void;
}

// Tow truck SVG for map marker with optional price label
function towTruckSVG(selected: boolean, price?: number | null): string {
  const bg = selected ? '#ef4444' : '#f59e0b';
  const border = selected ? '#ffffff' : '#1e2d42';
  const priceLabel =
    price != null
      ? `<div style="
          margin-top:5px;
          background:rgba(6,13,26,0.92);
          border:2px solid ${selected ? '#ef4444' : '#f59e0b'};
          border-radius:8px;
          padding:3px 9px;
          font-size:22px;
          font-weight:800;
          color:${selected ? '#ef4444' : '#f59e0b'};
          white-space:nowrap;
          line-height:1.3;
          box-shadow:0 3px 10px rgba(0,0,0,0.6);
          letter-spacing:-0.5px;
        ">$${price.toFixed(0)}</div>`
      : '';
  return `
    <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
      <div style="
        width:57px;height:57px;
        background:${bg};
        border:4px solid ${border};
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 6px 20px rgba(0,0,0,0.5);
        transition:background 0.15s ease;
      ">
        <svg style="transform:rotate(45deg);width:27px;height:27px;" viewBox="0 0 20 20" fill="${border}">
          <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
          <path d="M3 4a1 1 0 00-1 1v7a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h3a1 1 0 00.8-.4l2-2.667A1 1 0 0017 7h-3V5a1 1 0 00-1-1H3z"/>
        </svg>
      </div>
      ${priceLabel}
    </div>
  `;
}

export default function LeafletMap({ businesses, selectedId, onMarkerClick }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map());
  // Flips to true once Leaflet finishes async init, so dependent effects re-run
  const [mapReady, setMapReady] = useState(false);

  const validBusinesses = businesses.filter(
    (b) => b.lat !== null && b.lng !== null
  );

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamic Leaflet import to avoid SSR
    import('leaflet').then((L) => {
      if (!mapRef.current || mapInstanceRef.current) return;

      // Compute center from data or fallback to continental US
      let centerLat = 36.7783;
      let centerLng = -119.4179;
      if (validBusinesses.length > 0) {
        const lats = validBusinesses.map((b) => b.lat!);
        const lngs = validBusinesses.map((b) => b.lng!);
        centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
        centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
      }

      const map = L.map(mapRef.current!, {
        center: [centerLat, centerLng],
        zoom: validBusinesses.length > 0 ? 10 : 7,
        zoomControl: false,
      });

      mapInstanceRef.current = map;
      setMapReady(true);

      // Dark tile layer from Carto
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
          maxZoom: 19,
        }
      ).addTo(map);

      // Custom zoom control position
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Add markers
      validBusinesses.forEach((biz) => {
        const icon = L.divIcon({
          html: towTruckSVG(false, biz.totalQuote),
          className: 'tow-marker',
          iconSize: [57, 90],
          iconAnchor: [28, 57],
          popupAnchor: [0, -57],
        });

        const marker = L.marker([biz.lat!, biz.lng!], {
          icon,
          zIndexOffset: biz.totalQuote !== null ? 1000 : 0,
        });
        marker.on('click', () => onMarkerClick(biz));
        marker.addTo(map);
        markersRef.current.set(biz.id, marker);
      });

      // Fit bounds if we have markers
      if (validBusinesses.length > 1) {
        const latlngs = validBusinesses.map((b) => [b.lat!, b.lng!] as [number, number]);
        map.fitBounds(L.latLngBounds(latlngs), { padding: [60, 60] });
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current.clear();
        setMapReady(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker icons when selection changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    import('leaflet').then((L) => {
      markersRef.current.forEach((marker, id) => {
        const isSelected = id === selectedId;
        const biz = businesses.find((b) => b.id === id);
        marker.setIcon(
          L.divIcon({
            html: towTruckSVG(isSelected, biz?.totalQuote),
            className: 'tow-marker',
            iconSize: [57, 90],
            iconAnchor: [28, 57],
            popupAnchor: [0, -57],
          })
        );
        if (isSelected && mapInstanceRef.current) {
          mapInstanceRef.current.panTo(marker.getLatLng(), { animate: true, duration: 0.5 });
        }
      });
    });
  }, [selectedId, businesses]);

  // Add new markers if businesses list changes; remove stale ones; fit bounds
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    import('leaflet').then((L) => {
      // Remove markers no longer in the filtered list
      const currentIds = new Set(validBusinesses.map((b) => b.id));
      markersRef.current.forEach((marker, id) => {
        if (!currentIds.has(id)) {
          marker.remove();
          markersRef.current.delete(id);
        }
      });

      // Add any new markers
      validBusinesses.forEach((biz) => {
        if (!markersRef.current.has(biz.id)) {
          const icon = L.divIcon({
            html: towTruckSVG(biz.id === selectedId, biz.totalQuote),
            className: 'tow-marker',
            iconSize: [57, 90],
            iconAnchor: [28, 57],
            popupAnchor: [0, -57],
          });
          const marker = L.marker([biz.lat!, biz.lng!], {
            icon,
            zIndexOffset: biz.totalQuote !== null ? 1000 : 0,
          });
          marker.on('click', () => onMarkerClick(biz));
          marker.addTo(mapInstanceRef.current);
          markersRef.current.set(biz.id, marker);
        }
      });

      // Fit bounds whenever the businesses list is populated (initial load or city change)
      if (validBusinesses.length > 1) {
        const latlngs = validBusinesses.map((b) => [b.lat!, b.lng!] as [number, number]);
        mapInstanceRef.current.fitBounds(L.latLngBounds(latlngs), { padding: [60, 60] });
      } else if (validBusinesses.length === 1) {
        mapInstanceRef.current.setView(
          [validBusinesses[0].lat!, validBusinesses[0].lng!], 13
        );
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businesses, mapReady]);

  return (
    <div
      ref={mapRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 1 }}
    />
  );
}
