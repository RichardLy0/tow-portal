/**
 * Geocoding Pre-processor
 *
 * Reads the competitor CSV, geocodes all business addresses using
 * the free Nominatim (OpenStreetMap) API, and saves the result to
 * public/data/businesses.json for use by the Next.js dashboard.
 *
 * Usage:
 *   node scripts/geocode.mjs
 *
 * Note: Nominatim rate-limits to 1 request/second. With ~100 businesses,
 * this script takes ~2 minutes to complete. Results are cached so
 * subsequent runs are instant.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.join(__dirname, '..');
const CSV_PATH = path.join(PROJECT_ROOT, '..', 'Cleaned Pricing Quote Dataset.csv');
const OUTPUT_PATH = path.join(PROJECT_ROOT, 'public', 'data', 'businesses.json');
const CACHE_PATH = path.join(PROJECT_ROOT, 'public', 'data', 'geocode-cache.json');

// ─── CSV Parser ────────────────────────────────────────────────────────────────

/**
 * Minimal CSV parser that handles:
 * - Quoted fields containing commas, newlines, and escaped quotes
 * - UTF-8 encoding
 */
function parseCSV(content) {
  const rows = [];
  let headers = null;
  let i = 0;
  const len = content.length;

  while (i < len) {
    const row = [];
    let field = '';
    let inQuote = false;

    while (i < len) {
      const ch = content[i];

      if (inQuote) {
        if (ch === '"') {
          // Check for escaped quote
          if (content[i + 1] === '"') {
            field += '"';
            i += 2;
          } else {
            inQuote = false;
            i++;
          }
        } else {
          field += ch;
          i++;
        }
      } else {
        if (ch === '"') {
          inQuote = true;
          i++;
        } else if (ch === ',') {
          row.push(field);
          field = '';
          i++;
        } else if (ch === '\r' && content[i + 1] === '\n') {
          row.push(field);
          i += 2;
          break;
        } else if (ch === '\n') {
          row.push(field);
          i++;
          break;
        } else {
          field += ch;
          i++;
        }
      }
    }

    // Last field at EOF
    if (i === len && (field || row.length > 0)) {
      row.push(field);
    }

    if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;

    if (headers === null) {
      headers = row;
    } else {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = row[idx] ?? '';
      });
      rows.push(obj);
    }
  }

  return rows;
}

// ─── Geocoding ─────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function loadCache() {
  if (fs.existsSync(CACHE_PATH)) {
    try { return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8')); }
    catch { return {}; }
  }
  return {};
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

async function geocode(address, cache) {
  if (address in cache) return cache[address];

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=us`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TowDeputyPricingPortal/1.0' },
    });
    const data = await res.json();
    if (data.length > 0) {
      const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      cache[address] = coords;
      return coords;
    }
    cache[address] = null;
    return null;
  } catch (err) {
    console.error(`  ✗ Nominatim error: ${err.message}`);
    cache[address] = null;
    return null;
  }
}

// ─── Number parsing ────────────────────────────────────────────────────────────

function parseNum(val) {
  if (!val || val.trim() === '') return null;
  const n = parseFloat(val.replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? null : n;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Tow Deputy — Competitor Data Geocoding Script  ');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  if (!fs.existsSync(CSV_PATH)) {
    console.error(`✗ CSV not found at: ${CSV_PATH}`);
    console.error('  Make sure "Cleaned Pricing Quote Dataset.csv" is in the parent directory.');
    process.exit(1);
  }

  console.log(`✓ CSV found: ${path.basename(CSV_PATH)}`);

  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  const rows = parseCSV(content);

  const businesses = rows
    .filter((row) => row['business'] && row['business'].trim() !== '')
    .map((row, index) => ({
      id: `business-${index}`,
      cityState: row['city/state']?.trim() ?? '',
      name: row['business']?.trim() ?? '',
      address: row['address']?.trim() ?? '',
      phone: row['phone number']?.trim() ?? '',
      distanceMi: parseNum(row['distance 1 (mi)']),
      loadedDistanceMi: parseNum(row['distance 2 (mi)']),
      totalQuote: parseNum(row['price ($)']),
      hookupFee: parseNum(row['hookup fee ($)']),
      pricePerMile: parseNum(row['price/mile ($)']),
      notes: row['notes']?.trim() ?? '',
      dateCalled: row['date called']?.trim() ?? '',
      lat: null,
      lng: null,
    }));

  console.log(`✓ Parsed ${businesses.length} business records`);

  const uniqueAddresses = [...new Set(businesses.map((b) => b.address).filter(Boolean))];
  console.log(`✓ ${uniqueAddresses.length} unique addresses to geocode`);
  console.log('');

  const cache = loadCache();
  const alreadyCached = uniqueAddresses.filter((a) => a in cache).length;
  const toGeocode = uniqueAddresses.filter((a) => !(a in cache)).length;

  console.log(`  → ${alreadyCached} addresses already cached`);
  console.log(`  → ${toGeocode} addresses need geocoding`);
  if (toGeocode > 0) {
    const estimatedSeconds = toGeocode * 1.2;
    console.log(`  → Estimated time: ~${Math.ceil(estimatedSeconds)}s (Nominatim rate limit: 1 req/sec)`);
  }
  console.log('');

  let geocoded = 0;
  let failed = 0;

  for (let i = 0; i < uniqueAddresses.length; i++) {
    const address = uniqueAddresses[i];
    const cached = address in cache;

    if (!cached) {
      process.stdout.write(`  [${i + 1}/${uniqueAddresses.length}] Geocoding: ${address.substring(0, 60)}...`);
      await sleep(1100); // Nominatim rate limit
    }

    const coords = await geocode(address, cache);

    if (!cached) {
      if (coords) {
        console.log(` ✓ (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
        geocoded++;
        saveCache(cache); // Save incrementally in case of interruption
      } else {
        console.log(' ✗ not found');
        failed++;
      }
    }
  }

  // Assign coordinates to businesses
  let mapped = 0;
  businesses.forEach((biz) => {
    const coords = cache[biz.address];
    if (coords) {
      biz.lat = coords.lat;
      biz.lng = coords.lng;
      mapped++;
    }
  });

  // Save output
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(businesses, null, 2));

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✓ ${businesses.length} businesses saved to public/data/businesses.json`);
  console.log(`  → ${mapped} mapped (have coordinates)`);
  console.log(`  → ${businesses.length - mapped} unmapped (address not resolved)`);
  if (toGeocode > 0) {
    console.log(`  → ${geocoded} newly geocoded / ${failed} failed`);
  }
  console.log('');
  console.log('  Start your dev server: npm run dev');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
}

main().catch((err) => {
  console.error('\n✗ Fatal error:', err);
  process.exit(1);
});
