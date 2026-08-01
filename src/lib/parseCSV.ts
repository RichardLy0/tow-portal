import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import type { Business } from '@/types';

const CSV_PATH = path.join(
  process.cwd(),
  '..',
  'Cleaned Pricing Quote Dataset.csv'
);

interface RawRow {
  'city/state': string;
  business: string;
  address: string;
  'phone number': string;
  'pin 1': string;
  'pin 2': string;
  'distance 1 (mi)': string;
  'distance 2 (mi)': string;
  Script: string;
  'date called': string;
  'price ($)': string;
  'hookup fee ($)': string;
  'price/mile ($)': string;
  notes: string;
  'next contact date': string;
}

function parseNumber(val: string): number | null {
  if (!val || val.trim() === '') return null;
  const n = parseFloat(val.replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? null : n;
}

export function parseCSV(): Omit<Business, 'lat' | 'lng'>[] {
  if (!fs.existsSync(CSV_PATH)) {
    console.error('CSV file not found at:', CSV_PATH);
    return [];
  }

  const content = fs.readFileSync(CSV_PATH, 'utf-8');

  const { data, errors } = Papa.parse<RawRow>(content, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  if (errors.length > 0) {
    console.warn('CSV parse warnings:', errors.slice(0, 5));
  }

  return data
    .filter((row) => row.business && row.business.trim() !== '')
    .map((row, index) => ({
      id: `business-${index}`,
      cityState: row['city/state']?.trim() ?? '',
      name: row.business?.trim() ?? '',
      address: row.address?.trim() ?? '',
      phone: row['phone number']?.trim() ?? '',
      distanceMi: parseNumber(row['distance 1 (mi)']),
      loadedDistanceMi: parseNumber(row['distance 2 (mi)']),
      totalQuote: parseNumber(row['price ($)']),
      hookupFee: parseNumber(row['hookup fee ($)']),
      pricePerMile: parseNumber(row['price/mile ($)']),
      notes: row.notes?.trim() ?? '',
      dateCalled: row['date called']?.trim() ?? '',
      // Script is intentionally excluded to protect call methodology
    }));
}
