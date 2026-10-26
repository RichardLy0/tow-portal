export type PricingOffer = {
  price_id: string;
  market_id: string;
  name: string;
  unit_amount: number;
};

export type PricingAccess = {
  market_id: string;
  active: boolean;
};
