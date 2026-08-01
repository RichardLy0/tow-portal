import fs from 'fs';
import path from 'path';
import type { GeocodeCache } from '@/types';

const CACHE_PATH = path.join(process.cwd(), 'public', 'data', 'geocode-cache.json');
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';

function loadCache(): GeocodeCache {
  if (fs.existsSync(CACHE_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8')) as GeocodeCache;
    } catch {
      return {};
    }
  }
  return {};
}

function saveCache(cache: GeocodeCache): void {
  const dir = path.dirname(CACHE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

async function nominatimGeocode(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  const url = `${NOMINATIM_BASE}?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=us`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TowDeputyPricingPortal/1.0 (contact@towdeputy.com)' },
    });
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (err) {
    console.error('Nominatim error for:', address, err);
  }
  return null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let cache: GeocodeCache | null = null;

export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  if (!cache) {
    cache = loadCache();
  }

  if (address in cache) {
    return cache[address];
  }

  // Rate limit: Nominatim requires ≤1 req/sec
  await sleep(1100);

  const coords = await nominatimGeocode(address);
  cache[address] = coords;
  saveCache(cache);

  return coords;
}
