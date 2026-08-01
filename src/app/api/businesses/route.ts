import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parseCSV } from '@/lib/parseCSV';
import { geocodeAddress } from '@/lib/geocode';
import type { Business } from '@/types';

const BUSINESSES_PATH = path.join(process.cwd(), 'public', 'data', 'businesses.json');

export async function GET() {
  // Return cached file if it exists
  if (fs.existsSync(BUSINESSES_PATH)) {
    const data = JSON.parse(fs.readFileSync(BUSINESSES_PATH, 'utf-8')) as Business[];
    return NextResponse.json(data);
  }

  // Parse CSV and geocode (first-time setup — may be slow)
  const rawBusinesses = parseCSV();

  if (rawBusinesses.length === 0) {
    return NextResponse.json(
      { error: 'No data found. Ensure the CSV file is in the correct location.' },
      { status: 404 }
    );
  }

  const businesses: Business[] = [];

  for (const biz of rawBusinesses) {
    const coords = biz.address ? await geocodeAddress(biz.address) : null;
    businesses.push({
      ...biz,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    });
  }

  // Cache for subsequent requests
  const dir = path.dirname(BUSINESSES_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(BUSINESSES_PATH, JSON.stringify(businesses, null, 2));

  return NextResponse.json(businesses);
}
