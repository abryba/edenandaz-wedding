import type { AlertKind, EvaluatedListing } from './types';

/**
 * Classify a scraped price against its product RRP and the effective threshold.
 * Effective threshold = product.threshold_pct ?? settings.default_threshold_pct.
 */
export function classify(params: {
  price: number | null;
  rrp: number;
  thresholdPct: number;
  hadError: boolean;
}): { kind: AlertKind; deviationPct: number | null } {
  const { price, rrp, thresholdPct, hadError } = params;

  if (hadError || price == null) {
    return { kind: 'error', deviationPct: null };
  }
  if (rrp <= 0) {
    return { kind: 'within_threshold', deviationPct: null };
  }

  const deviationPct = ((price - rrp) / rrp) * 100;

  if (Math.abs(deviationPct) <= thresholdPct) {
    return { kind: 'within_threshold', deviationPct };
  }
  return { kind: deviationPct > 0 ? 'above_rrp' : 'below_rrp', deviationPct };
}

/** A listing needs an alert if it deviates beyond threshold or errored. */
export function isAlerting(e: EvaluatedListing): boolean {
  return e.kind === 'above_rrp' || e.kind === 'below_rrp' || e.kind === 'error';
}

export function fmtMoney(value: number | null, currency: string): string {
  if (value == null) return '—';
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function fmtPct(value: number | null): string {
  if (value == null) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}
