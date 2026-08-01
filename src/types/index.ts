export interface Business {
  id: string;
  cityState: string;
  name: string;
  address: string;
  phone: string;
  distanceMi: number | null;
  loadedDistanceMi: number | null;
  totalQuote: number | null;
  hookupFee: number | null;
  pricePerMile: number | null;
  notes: string;
  dateCalled: string;
  lat: number | null;
  lng: number | null;
}

export interface GeocodeCache {
  [address: string]: { lat: number; lng: number } | null;
}
