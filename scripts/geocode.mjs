/**
 * Geocoding Pre-processor
 *
 * Reads the competitor CSV, geocodes all business addresses using
 * the US Census Bureau Geocoder (free, no rate limits, batch support),
 * and saves the result to public/data/businesses.json for use by the
 * Next.js dashboard.
 *
 * Usage:
 *   node scripts/geocode.mjs
 *
 * Results are cached so subsequent runs are instant.
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

const CENSUS_BATCH_URL = 'https://geocoding.geo.census.gov/geocoder/locations/addressbatch';
const BATCH_SIZE = 1000;

// ─── CSV Parser ────────────────────────────────────────────────────────────────

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

    if (i === len && (field || row.length > 0)) {
      row.push(field);
    }

    if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;

    if (headers === null) {
      headers = row;
    } else {
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = row[idx] ?? ''; });
      rows.push(obj);
    }
  }

  return rows;
}

// ─── Address parsing ───────────────────────────────────────────────────────────

/**
 * Splits a full address string like "123 Main St, Springfield, IL 62701, USA"
 * into { street, city, state, zip } for the Census batch API.
 */
function splitAddress(fullAddress) {
  const cleaned = fullAddress.replace(/, USA$/, '').trim();
  // Match: street, city, STATE ZIP  (e.g. "123 Main St, Springfield, IL 62701")
  const match = cleaned.match(/^(.+),\s*(.+),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)$/);
  if (match) {
    return { street: match[1].trim(), city: match[2].trim(), state: match[3].trim(), zip: match[4].trim() };
  }
  // Fallback: put everything in street, leave rest blank
  return { street: cleaned, city: '', state: '', zip: '' };
}

// ─── Census Batch Geocoder ─────────────────────────────────────────────────────

/**
 * Sends up to 1000 addresses to the Census batch geocoder.
 * Returns a map of { id -> { lat, lng } | null }
 */
async function censusBatchGeocode(addressMap) {
  const entries = Object.entries(addressMap);
  if (entries.length === 0) return {};

  // Build CSV payload: Unique ID, Street address, City, State, ZIP
  const lines = entries.map(([id, addr]) => {
    const { street, city, state, zip } = splitAddress(addr);
    const esc = (s) => `"${s.replace(/"/g, '""')}"`;
    return `${id},${esc(street)},${esc(city)},${esc(state)},${esc(zip)}`;
  });
  const csvPayload = lines.join('\n');

  const formData = new FormData();
  formData.append('addressFile', new Blob([csvPayload], { type: 'text/plain' }), 'addresses.csv');
  formData.append('benchmark', 'Public_AR_Current');
  formData.append('returntype', 'locations');

  const res = await fetch(CENSUS_BATCH_URL, { method: 'POST', body: formData });

  if (!res.ok) {
    throw new Error(`Census API HTTP ${res.status}: ${await res.text()}`);
  }

  const text = await res.text();
  const results = {};

  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    // Response is quoted CSV: "ID","InputAddr","Match","Exact","MatchedAddr","lon,lat","TigerID","Side"
    // Must parse as proper CSV since address fields contain commas
    const fields = [];
    const fieldRe = /"([^"]*)"/g;
    let m;
    while ((m = fieldRe.exec(line)) !== null) fields.push(m[1]);

    const id = fields[0];
    const matchStatus = fields[2]; // "Match" or "No_Match"
    const coordStr = fields[5];    // "-83.5242,32.8189"

    if (!id) continue;

    if (matchStatus === 'Match' && coordStr) {
      const commaIdx = coordStr.indexOf(',');
      const lng = parseFloat(coordStr.slice(0, commaIdx));
      const lat = parseFloat(coordStr.slice(commaIdx + 1));
      if (!isNaN(lat) && !isNaN(lng)) {
        results[id] = { lat, lng };
        continue;
      }
    }
    results[id] = null;
  }

  return results;
}

// ─── Cache helpers ─────────────────────────────────────────────────────────────

function loadCache() {
  if (fs.existsSync(CACHE_PATH)) {
    try { return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8')); }
    catch { return {}; }
  }
  return {};
}

function saveCache(cache) {
  fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
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
  console.log('  (US Census Bureau Geocoder — free, no limits)  ');
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

  const cache = loadCache();
  const uncached = uniqueAddresses.filter((a) => !(a in cache));
  const alreadyCached = uniqueAddresses.length - uncached.length;

  console.log(`  → ${alreadyCached} already cached, ${uncached.length} need geocoding`);
  console.log('');

  if (uncached.length > 0) {
    // Build id->address map for batch requests
    // Use index as ID so we can match results back
    const idToAddress = {};
    uncached.forEach((addr, i) => { idToAddress[String(i)] = addr; });

    const batches = [];
    const ids = Object.keys(idToAddress);
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batchIds = ids.slice(i, i + BATCH_SIZE);
      const batch = {};
      batchIds.forEach((id) => { batch[id] = idToAddress[id]; });
      batches.push(batch);
    }

    console.log(`  Sending ${batches.length} batch request(s) to US Census Geocoder...`);

    let geocoded = 0;
    let failed = 0;

    for (let b = 0; b < batches.length; b++) {
      if (batches.length > 1) {
        process.stdout.write(`  Batch ${b + 1}/${batches.length}...`);
      }

      const batchResults = await censusBatchGeocode(batches[b]);

      for (const [id, coords] of Object.entries(batchResults)) {
        const address = idToAddress[id];
        cache[address] = coords;
        if (coords) geocoded++;
        else failed++;
      }

      if (batches.length > 1) {
        console.log(` done (${Object.values(batchResults).filter(Boolean).length} matched)`);
      }
    }

    saveCache(cache);

    console.log('');
    console.log(`  ✓ ${geocoded} addresses geocoded successfully`);
    if (failed > 0) console.log(`  ✗ ${failed} addresses not found`);
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

  // Delete old businesses.json so the API re-reads the fresh data
  if (fs.existsSync(OUTPUT_PATH)) fs.unlinkSync(OUTPUT_PATH);

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(businesses, null, 2));

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✓ ${businesses.length} businesses saved to public/data/businesses.json`);
  console.log(`  → ${mapped} mapped (have coordinates)`);
  console.log(`  → ${businesses.length - mapped} unmapped`);
  console.log('');
  console.log('  Start your dev server: npm run dev');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
}

main().catch((err) => {
  console.error('\n✗ Fatal error:', err);
  process.exit(1);
});
