import { getServiceClient } from './supabase';
import { buildEvaluations, type PriceInput } from './evaluate';
import type { Dealer, EvaluatedListing, Listing, Product, Settings } from './types';

/**
 * Build the dashboard view from the LATEST stored snapshot of each listing
 * (and the one before, to flag day-to-day changes). Read-only; no scraping.
 */
export async function getDashboardData(): Promise<{
  settings: Settings;
  evaluations: EvaluatedListing[];
  lastScrapedAt: string | null;
}> {
  const db = getServiceClient();

  const [{ data: settingsRow }, { data: listings }, { data: products }, { data: dealers }] =
    await Promise.all([
      db.from('settings').select('*').eq('id', 1).single(),
      db.from('listings').select('*').eq('active', true),
      db.from('products').select('*'),
      db.from('dealers').select('*'),
    ]);

  const settings = settingsRow as Settings;
  const productMap = new Map((products as Product[]).map((p) => [p.id, p]));
  const dealerMap = new Map((dealers as Dealer[]).map((d) => [d.id, d]));
  const activeListings = (listings as Listing[]) ?? [];

  const prices = new Map<string, PriceInput>();
  let lastScrapedAt: string | null = null;

  await Promise.all(
    activeListings.map(async (l) => {
      const { data } = await db
        .from('price_snapshots')
        .select('price, currency, scraped_at, status, error_message')
        .eq('listing_id', l.id)
        .order('scraped_at', { ascending: false })
        .limit(2);

      const latest = data?.[0];
      const prev = data?.[1];
      if (latest && (!lastScrapedAt || latest.scraped_at > lastScrapedAt)) {
        lastScrapedAt = latest.scraped_at;
      }
      prices.set(l.id, {
        price: latest?.status === 'ok' ? (latest.price as number) : null,
        currency: (latest?.currency as string) ?? null,
        previousPrice: prev?.status === 'ok' ? (prev.price as number) : null,
        error: latest?.status === 'error' ? latest.error_message || 'Scrape error' : undefined,
      });
    })
  );

  const evaluations = buildEvaluations({
    listings: activeListings,
    products: productMap,
    dealers: dealerMap,
    prices,
    settings,
  });

  return { settings, evaluations, lastScrapedAt };
}
