import type { AdminMarket, AdminObservation, ModeledPrice } from '@/types/pricing-admin';

const ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const STATE = /^[A-Z]{2}$/;
const text = (value: unknown, max = 160): string | null => typeof value === 'string' && value.length <= max ? value : null;
const nullableText = (value: unknown, max = 160): string | null | undefined => value === null ? null : text(value, max) ?? undefined;
const id = (value: unknown): string | null => typeof value === 'string' && ID.test(value) ? value : null;
const cents = (value: unknown): number | null => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
const nullableCents = (value: unknown): number | null | undefined => value === null ? null : cents(value) ?? undefined;
const nullableNumber = (value: unknown): number | null | undefined => value === null ? null : typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
const ids = (value: unknown): string[] | null => Array.isArray(value) && value.length <= 100 && value.every((item) => id(item)) ? value as string[] : null;
const record = (value: unknown): Record<string, unknown> | null => typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;

export function parseMarkets(body: unknown): AdminMarket[] | null {
  if (!Array.isArray(body)) return null;
  const parsed = body.map(market);
  return parsed.every((item): item is AdminMarket => item !== null) ? parsed : null;
}

function market(item: unknown): AdminMarket | null {
  const value = record(item); if (!value) return null;
  const marketId = id(value.market_id), cityName = text(value.city_name), stateCode = text(value.state_code, 2);
  const archivedAt = nullableText(value.archived_at, 64);
  return marketId && cityName !== null && stateCode !== null && STATE.test(stateCode) && typeof value.available === 'boolean' && (value.archived_at === undefined || archivedAt !== undefined)
    ? { market_id: marketId, city_name: cityName, state_code: stateCode, available: value.available, ...(archivedAt === undefined ? {} : { archived_at: archivedAt }) } : null;
}

export function parseMarket(body: unknown): AdminMarket | null { return market(body); }

function observation(value: unknown): AdminObservation | null {
  const item = record(value); if (!item) return null;
  const observationId = id(item.id), city = text(item.city), state = text(item.state, 2), markets = ids(item.market_ids);
  const rawDate = nullableText(item.raw_date, 32);
  const normalizedDate = nullableText(item.normalized_date, 32);
  const writerMarketId = nullableText(item.writer_market_id, 160);
  const total = nullableCents(item.total_cents), hookup = nullableCents(item.hookup_cents), perMile = nullableCents(item.per_mile_cents);
  const distance = nullableNumber(item.distance_miles), loaded = nullableNumber(item.loaded_distance_miles);
  if (!observationId || city === null || state === null || !STATE.test(state) || !markets || rawDate === undefined || normalizedDate === undefined || writerMarketId === undefined || total === undefined || hookup === undefined || perMile === undefined || distance === undefined || loaded === undefined) return null;
  return { id: observationId, writer_market_id: writerMarketId, city, state, raw_date: rawDate, normalized_date: normalizedDate, total_cents: total, hookup_cents: hookup, per_mile_cents: perMile, distance_miles: distance, loaded_distance_miles: loaded, market_ids: markets };
}

export function parseObservations(body: unknown): { observations: AdminObservation[]; next_cursor: string | null } | null {
  const item = record(body); if (!item || !Array.isArray(item.observations)) return null;
  const observations = item.observations.map(observation);
  const cursor = item.next_cursor;
  if (!observations.every((x): x is AdminObservation => x !== null) || (cursor !== null && (typeof cursor !== 'string' || cursor.length > 1024))) return null;
  return { observations, next_cursor: cursor };
}

function modeled(value: unknown): ModeledPrice | null {
  const item = record(value); if (!item) return null;
  const priceId = id(item.price_id), markets = ids(item.market_ids);
  return priceId && markets ? { price_id: priceId, market_ids: markets } : null;
}
export function parseModeledPrices(body: unknown): ModeledPrice[] | null {
  if (!Array.isArray(body)) return null;
  const parsed = body.map(modeled); return parsed.every((x): x is ModeledPrice => x !== null) ? parsed : null;
}
export function parseModeledPrice(body: unknown): ModeledPrice | null { return modeled(body); }

export function validId(value: string): boolean { return ID.test(value); }
export function validDate(value: string): boolean { return DATE.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)); }
export function validMarketInput(value: unknown): value is { city_name: string; state_code: string; available: boolean } {
  const item = record(value); return !!item && text(item.city_name) !== null && text(item.city_name)!.trim().length > 0 && typeof item.state_code === 'string' && STATE.test(item.state_code) && typeof item.available === 'boolean';
}
export function validMarketIds(value: unknown): value is string[] { return Array.isArray(value) && value.length <= 100 && value.every((item) => typeof item === 'string' && ID.test(item)); }
