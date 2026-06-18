/**
 * Daily scraper job.
 *
 * 1. Loads settings, active listings (+ product/dealer), and recipients.
 * 2. Looks up each listing's previous price (last snapshot).
 * 3. Scrapes the current price from each dealer page.
 * 4. Writes a new snapshot row per listing.
 * 5. Evaluates each price vs RRP using the effective % threshold.
 * 6. Emails a report (always, or only when there are alerts).
 *
 * Run locally:   npm run scrape        (writes + emails)
 *                npm run scrape:dry    (no writes, no email)
 * Run in CI:     see .github/workflows/price-monitor-daily.yml
 */
import 'dotenv/config';
import { getServiceClient } from '../src/lib/supabase';
import { scrapeListing } from '../src/lib/scrape';
import { buildEvaluations, type PriceInput } from '../src/lib/evaluate';
import { isAlerting } from '../src/lib/alerts';
import {
  buildEmailHtml,
  buildEmailSubject,
  sendReportEmail,
} from '../src/lib/email';
import type { Dealer, Listing, Product, Recipient, Settings } from '../src/lib/types';

const DRY_RUN = process.env.DRY_RUN === 'true';
const CONCURRENCY = 4;
const POLITE_DELAY_MS = 800; // pause between batches to be a courteous scraper

async function mapPool<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    const batch = items.slice(i, i + size);
    results.push(...(await Promise.all(batch.map(fn))));
    if (i + size < items.length) await new Promise((r) => setTimeout(r, POLITE_DELAY_MS));
  }
  return results;
}

async function main() {
  const startedAt = new Date();
  console.log(`[scrape] starting ${startedAt.toISOString()} (dry_run=${DRY_RUN})`);
  const db = getServiceClient();

  // --- Load configuration ---------------------------------------------------
  const [{ data: settingsRow }, { data: listings }, { data: products }, { data: dealers }, { data: recipients }] =
    await Promise.all([
      db.from('settings').select('*').eq('id', 1).single(),
      db.from('listings').select('*').eq('active', true),
      db.from('products').select('*').eq('active', true),
      db.from('dealers').select('*').eq('active', true),
      db.from('recipients').select('*').eq('active', true),
    ]);

  const settings = settingsRow as Settings;
  const productMap = new Map((products as Product[]).map((p) => [p.id, p]));
  const dealerMap = new Map((dealers as Dealer[]).map((d) => [d.id, d]));
  const activeListings = (listings as Listing[]).filter(
    (l) => productMap.has(l.product_id) && dealerMap.has(l.dealer_id)
  );

  console.log(`[scrape] ${activeListings.length} active listings to scrape`);

  // --- Previous prices (last snapshot per listing) --------------------------
  const previous = new Map<string, number | null>();
  await Promise.all(
    activeListings.map(async (l) => {
      const { data } = await db
        .from('price_snapshots')
        .select('price')
        .eq('listing_id', l.id)
        .eq('status', 'ok')
        .order('scraped_at', { ascending: false })
        .limit(1);
      previous.set(l.id, data && data[0] ? (data[0].price as number) : null);
    })
  );

  // --- Scrape ---------------------------------------------------------------
  const prices = new Map<string, PriceInput>();
  const snapshotsToInsert: Record<string, unknown>[] = [];

  await mapPool(activeListings, CONCURRENCY, async (listing) => {
    const result = await scrapeListing(listing.product_url, listing.css_selector);
    const dealer = dealerMap.get(listing.dealer_id);
    const product = productMap.get(listing.product_id);
    console.log(
      `[scrape]  ${product?.sku} @ ${dealer?.name}: ` +
        (result.price != null ? `${result.price} (${result.method})` : `ERROR ${result.error}`)
    );

    prices.set(listing.id, {
      price: result.price,
      currency: result.currency,
      previousPrice: previous.get(listing.id) ?? null,
      error: result.error,
    });

    snapshotsToInsert.push({
      listing_id: listing.id,
      price: result.price,
      currency: result.currency,
      status: result.price != null ? 'ok' : 'error',
      method: result.method,
      raw_text: result.raw,
      error_message: result.error ?? null,
    });
  });

  // --- Persist snapshots ----------------------------------------------------
  if (!DRY_RUN && snapshotsToInsert.length) {
    const { error } = await db.from('price_snapshots').insert(snapshotsToInsert);
    if (error) console.error('[scrape] failed to insert snapshots:', error.message);
    else console.log(`[scrape] inserted ${snapshotsToInsert.length} snapshots`);
  }

  // --- Evaluate -------------------------------------------------------------
  const evaluations = buildEvaluations({
    listings: activeListings,
    products: productMap,
    dealers: dealerMap,
    prices,
    settings,
  });
  const alertCount = evaluations.filter(isAlerting).length;
  console.log(`[scrape] ${alertCount} alert(s) of ${evaluations.length} listings`);

  // --- Email ----------------------------------------------------------------
  const to = (recipients as Recipient[]).map((r) => r.email);
  const shouldEmail = settings.email_mode === 'always' || alertCount > 0;

  if (DRY_RUN) {
    console.log('[scrape] DRY_RUN: skipping email send');
  } else if (!shouldEmail) {
    console.log("[scrape] email_mode=alerts_only and no alerts — not sending email");
  } else {
    const html = buildEmailHtml(evaluations, { generatedAt: startedAt, currency: settings.currency });
    const subject = buildEmailSubject(evaluations, settings.email_subject_prefix);
    const { id, error } = await sendReportEmail({ to, subject, html });
    if (error) {
      console.error('[scrape] email failed:', error);
      process.exitCode = 1;
    } else {
      console.log(`[scrape] email sent (id=${id}) to ${to.length} recipient(s)`);
    }
  }

  console.log(`[scrape] done in ${((Date.now() - startedAt.getTime()) / 1000).toFixed(1)}s`);
}

main().catch((err) => {
  console.error('[scrape] fatal:', err);
  process.exit(1);
});
