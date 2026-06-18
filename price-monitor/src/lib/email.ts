import { Resend } from 'resend';
import type { EvaluatedListing } from './types';
import { fmtMoney, fmtPct, isAlerting } from './alerts';

function kindBadge(e: EvaluatedListing): string {
  switch (e.kind) {
    case 'above_rrp':
      return '<span style="color:#b91c1c;font-weight:600">ABOVE RRP</span>';
    case 'below_rrp':
      return '<span style="color:#c2410c;font-weight:600">BELOW RRP</span>';
    case 'error':
      return '<span style="color:#6b7280;font-weight:600">SCRAPE ERROR</span>';
    default:
      return '<span style="color:#15803d">OK</span>';
  }
}

export function buildEmailHtml(
  rows: EvaluatedListing[],
  opts: { generatedAt: Date; currency: string }
): string {
  const alerts = rows.filter(isAlerting);
  const ok = rows.filter((r) => !isAlerting(r));

  const renderRow = (e: EvaluatedListing) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(e.product.name)}<br>
        <span style="color:#888;font-size:12px">${escapeHtml(e.product.sku)}</span></td>
      <td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(e.dealer.name)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${fmtMoney(e.product.rrp, e.currency)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${fmtMoney(e.price, e.currency)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${fmtPct(e.deviationPct)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${
        e.changedSinceYesterday ? '↕︎' : ''
      }</td>
      <td style="padding:8px;border-bottom:1px solid #eee">${kindBadge(e)}<br>
        <a href="${escapeAttr(e.listing.product_url)}" style="font-size:12px;color:#2563eb">view page</a></td>
    </tr>`;

  const tableHeader = `
    <tr style="background:#f9fafb;text-align:left">
      <th style="padding:8px">Product</th>
      <th style="padding:8px">Dealer</th>
      <th style="padding:8px;text-align:right">RRP</th>
      <th style="padding:8px;text-align:right">Price</th>
      <th style="padding:8px;text-align:right">Δ vs RRP</th>
      <th style="padding:8px;text-align:center">Changed</th>
      <th style="padding:8px">Status</th>
    </tr>`;

  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:760px;margin:0 auto;color:#111">
    <h2 style="margin-bottom:4px">Daily Dealer Price Report</h2>
    <p style="color:#666;margin-top:0">${opts.generatedAt.toUTCString()} · ${rows.length} listings monitored · ${alerts.length} alert(s)</p>

    ${
      alerts.length
        ? `<h3 style="color:#b91c1c">⚠ Alerts (${alerts.length})</h3>
           <table style="border-collapse:collapse;width:100%;font-size:14px">
             ${tableHeader}${alerts.map(renderRow).join('')}
           </table>`
        : `<p style="padding:12px;background:#ecfdf5;border-radius:6px;color:#065f46">
             ✓ All monitored dealer prices are within the configured RRP threshold.</p>`
    }

    <h3 style="margin-top:28px;color:#374151">All listings (${rows.length})</h3>
    <table style="border-collapse:collapse;width:100%;font-size:14px">
      ${tableHeader}${[...alerts, ...ok].map(renderRow).join('')}
    </table>

    <p style="color:#9ca3af;font-size:12px;margin-top:24px">
      Generated automatically by Price Monitor. ↕︎ = price changed since the previous scrape.
    </p>
  </div>`;
}

export function buildEmailSubject(
  rows: EvaluatedListing[],
  prefix: string
): string {
  const alerts = rows.filter(isAlerting).length;
  const today = new Date().toISOString().slice(0, 10);
  return alerts > 0
    ? `${prefix} ⚠ ${alerts} price alert(s) — ${today}`
    : `${prefix} ✓ All prices OK — ${today}`;
}

export async function sendReportEmail(params: {
  to: string[];
  subject: string;
  html: string;
}): Promise<{ id: string | null; error: string | null }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ALERT_FROM_EMAIL;
  if (!apiKey || !from) {
    return { id: null, error: 'Missing RESEND_API_KEY or ALERT_FROM_EMAIL' };
  }
  if (params.to.length === 0) {
    return { id: null, error: 'No active recipients configured' };
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
  return { id: data?.id ?? null, error: error ? error.message : null };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/"/g, '&quot;');
}
