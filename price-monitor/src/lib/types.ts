export interface Settings {
  id: number;
  currency: string;
  default_threshold_pct: number;
  email_mode: 'alerts_only' | 'always';
  email_subject_prefix: string;
  updated_at: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  rrp: number;
  threshold_pct: number | null;
  active: boolean;
  created_at: string;
}

export interface Dealer {
  id: string;
  name: string;
  website: string | null;
  active: boolean;
  created_at: string;
}

export interface Listing {
  id: string;
  product_id: string;
  dealer_id: string;
  product_url: string;
  css_selector: string | null;
  active: boolean;
  created_at: string;
}

export interface PriceSnapshot {
  id: string;
  listing_id: string;
  scraped_at: string;
  price: number | null;
  currency: string | null;
  status: 'ok' | 'error';
  method: string | null;
  raw_text: string | null;
  error_message: string | null;
}

export interface Recipient {
  id: string;
  email: string;
  name: string | null;
  active: boolean;
  created_at: string;
}

/** Classification of a listing's current price relative to RRP. */
export type AlertKind = 'above_rrp' | 'below_rrp' | 'within_threshold' | 'error';

export interface EvaluatedListing {
  listing: Listing;
  product: Product;
  dealer: Dealer;
  price: number | null;
  previousPrice: number | null;
  currency: string;
  deviationPct: number | null; // (price - rrp) / rrp * 100
  thresholdPct: number;
  kind: AlertKind;
  changedSinceYesterday: boolean;
  error?: string;
}
