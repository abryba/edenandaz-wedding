import * as cheerio from 'cheerio';

export interface ScrapeResult {
  price: number | null;
  currency: string | null;
  method: string | null; // which strategy matched
  raw: string | null; // raw matched text
  error?: string;
}

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/**
 * Parse a human/markup price string into a number.
 * Handles: "£1,299.00", "1.299,00 €", "$89.99", "USD 49", "1 299,50".
 * Returns null if no sensible number is found.
 */
export function parsePrice(input: string | number | null | undefined): number | null {
  if (input == null) return null;
  if (typeof input === 'number') return Number.isFinite(input) ? input : null;

  // Keep digits and separators only.
  let s = input.replace(/[^0-9.,]/g, '').trim();
  if (!s) return null;

  const hasComma = s.includes(',');
  const hasDot = s.includes('.');

  if (hasComma && hasDot) {
    // The right-most separator is the decimal point.
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      // European format: 1.299,00 -> remove dots, comma => dot
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      // US/UK format: 1,299.00 -> remove commas
      s = s.replace(/,/g, '');
    }
  } else if (hasComma) {
    // Could be decimal comma (49,99) or thousands (1,299).
    const parts = s.split(',');
    if (parts.length === 2 && parts[1].length === 2) {
      s = parts[0] + '.' + parts[1]; // decimal comma
    } else {
      s = s.replace(/,/g, ''); // thousands separators
    }
  }
  // Strip any stray leading/trailing dots.
  s = s.replace(/^\.+|\.+$/g, '');

  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function detectCurrency(text: string): string | null {
  if (/£|\bGBP\b/i.test(text)) return 'GBP';
  if (/€|\bEUR\b/i.test(text)) return 'EUR';
  if (/\bUSD\b|\$/.test(text)) return 'USD';
  if (/\bAUD\b/i.test(text)) return 'AUD';
  return null;
}

/** Recursively search a JSON-LD object graph for an offers/price value. */
function findPriceInJsonLd(node: unknown): { price: number; currency: string | null } | null {
  if (node == null) return null;

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findPriceInJsonLd(item);
      if (found) return found;
    }
    return null;
  }

  if (typeof node === 'object') {
    const obj = node as Record<string, unknown>;

    // Direct price fields on this node.
    const priceVal = obj.price ?? obj.lowPrice ?? obj.highPrice;
    if (priceVal != null) {
      const price = parsePrice(priceVal as string | number);
      if (price != null) {
        const currency =
          (typeof obj.priceCurrency === 'string' && obj.priceCurrency) || null;
        return { price, currency };
      }
    }

    // Recurse into common containers.
    for (const key of ['offers', '@graph', 'hasVariant', 'itemListElement']) {
      if (obj[key] != null) {
        const found = findPriceInJsonLd(obj[key]);
        if (found) return found;
      }
    }
  }
  return null;
}

/**
 * Extract a price from raw HTML using a cascade of strategies, most reliable
 * first. An optional CSS selector takes top priority when provided.
 */
export function extractPrice(html: string, cssSelector?: string | null): ScrapeResult {
  const $ = cheerio.load(html);

  // Strategy 0: explicit per-listing CSS selector.
  if (cssSelector) {
    const el = $(cssSelector).first();
    if (el.length) {
      const text = (el.attr('content') || el.text() || '').trim();
      const price = parsePrice(text);
      if (price != null) {
        return { price, currency: detectCurrency(text), method: 'css_selector', raw: text };
      }
    }
  }

  // Strategy 1: JSON-LD structured data (schema.org Product/Offer).
  const ldScripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < ldScripts.length; i++) {
    const raw = $(ldScripts[i]).contents().text();
    if (!raw.trim()) continue;
    try {
      const parsed = JSON.parse(raw);
      const found = findPriceInJsonLd(parsed);
      if (found) {
        return {
          price: found.price,
          currency: found.currency,
          method: 'json_ld',
          raw: JSON.stringify(found),
        };
      }
    } catch {
      // Malformed JSON-LD blocks are common; ignore and continue.
    }
  }

  // Strategy 2: meta / OpenGraph price tags.
  const metaSelectors = [
    'meta[property="product:price:amount"]',
    'meta[property="og:price:amount"]',
    'meta[itemprop="price"]',
    'meta[name="twitter:data1"]',
  ];
  for (const sel of metaSelectors) {
    const content = $(sel).attr('content');
    if (content) {
      const price = parsePrice(content);
      if (price != null) {
        const curMeta =
          $('meta[property="product:price:currency"]').attr('content') ||
          $('meta[property="og:price:currency"]').attr('content') ||
          detectCurrency(content);
        return { price, currency: curMeta, method: 'meta_tag', raw: content };
      }
    }
  }

  // Strategy 3: microdata itemprop="price".
  const itemprop = $('[itemprop="price"]').first();
  if (itemprop.length) {
    const text = itemprop.attr('content') || itemprop.text();
    const price = parsePrice(text);
    if (price != null) {
      const cur =
        $('[itemprop="priceCurrency"]').attr('content') || detectCurrency(text);
      return { price, currency: cur, method: 'microdata', raw: text };
    }
  }

  // Strategy 4: heuristic — common price-bearing classes.
  const classGuesses = [
    '.price .amount',
    '.product-price',
    '.price__current',
    '.current-price',
    '[class*="price"]',
  ];
  for (const sel of classGuesses) {
    const el = $(sel).first();
    if (el.length) {
      const text = el.text().trim();
      const price = parsePrice(text);
      if (price != null && price > 0) {
        return { price, currency: detectCurrency(text), method: 'class_heuristic', raw: text };
      }
    }
  }

  return { price: null, currency: null, method: null, raw: null, error: 'No price found in page' };
}

/** Fetch a URL and extract its price. Network/HTTP errors are returned, not thrown. */
export async function scrapeListing(
  url: string,
  cssSelector?: string | null,
  timeoutMs = 20000
): Promise<ScrapeResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    if (!res.ok) {
      return { price: null, currency: null, method: null, raw: null, error: `HTTP ${res.status}` };
    }
    const html = await res.text();
    return extractPrice(html, cssSelector);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { price: null, currency: null, method: null, raw: null, error: message };
  } finally {
    clearTimeout(timer);
  }
}
