export type AdminMarket = { market_id: string; city_name: string; state_code: string; available: boolean; archived_at?: string | null };
export type AdminObservation = {
  id: string; writer_market_id: string | null; city: string; state: string; raw_date: string | null;
  normalized_date: string | null; total_cents: number | null; hookup_cents: number | null;
  per_mile_cents: number | null; distance_miles: number | null; loaded_distance_miles: number | null;
  market_ids: string[];
};
export type ModeledPrice = { price_id: string; market_ids: string[] };
