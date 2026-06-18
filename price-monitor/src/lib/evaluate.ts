import { classify } from './alerts';
import type {
  Dealer,
  EvaluatedListing,
  Listing,
  Product,
  Settings,
} from './types';

export interface PriceInput {
  price: number | null;
  currency: string | null;
  previousPrice: number | null;
  error?: string;
}

/**
 * Join listings with their product/dealer and a per-listing price input,
 * then classify each against RRP and the effective threshold. Pure function —
 * no I/O — so it is shared by the scraper job and the admin dashboard.
 */
export function buildEvaluations(args: {
  listings: Listing[];
  products: Map<string, Product>;
  dealers: Map<string, Dealer>;
  prices: Map<string, PriceInput>;
  settings: Settings;
}): EvaluatedListing[] {
  const { listings, products, dealers, prices, settings } = args;
  const out: EvaluatedListing[] = [];

  for (const listing of listings) {
    const product = products.get(listing.product_id);
    const dealer = dealers.get(listing.dealer_id);
    if (!product || !dealer) continue;

    const input = prices.get(listing.id) ?? {
      price: null,
      currency: null,
      previousPrice: null,
      error: 'No price data',
    };

    const thresholdPct = product.threshold_pct ?? settings.default_threshold_pct;
    const { kind, deviationPct } = classify({
      price: input.price,
      rrp: product.rrp,
      thresholdPct,
      hadError: !!input.error,
    });

    const changedSinceYesterday =
      input.price != null &&
      input.previousPrice != null &&
      Math.abs(input.price - input.previousPrice) > 0.001;

    out.push({
      listing,
      product,
      dealer,
      price: input.price,
      previousPrice: input.previousPrice,
      currency: input.currency || settings.currency,
      deviationPct,
      thresholdPct,
      kind,
      changedSinceYesterday,
      error: input.error,
    });
  }

  // Alerts first, then by absolute deviation desc.
  return out.sort((a, b) => {
    const rank = (k: string) => (k === 'error' ? 2 : k === 'within_threshold' ? 1 : 0);
    const r = rank(a.kind) - rank(b.kind);
    if (r !== 0) return r;
    return Math.abs(b.deviationPct ?? 0) - Math.abs(a.deviationPct ?? 0);
  });
}
