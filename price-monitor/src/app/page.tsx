import { getDashboardData } from '@/lib/dashboard';
import { fmtMoney, fmtPct, isAlerting } from '@/lib/alerts';
import type { AlertKind } from '@/lib/types';

export const dynamic = 'force-dynamic';

function badge(kind: AlertKind) {
  const map: Record<AlertKind, [string, string]> = {
    above_rrp: ['above', 'Above RRP'],
    below_rrp: ['below', 'Below RRP'],
    within_threshold: ['ok', 'Within RRP'],
    error: ['error', 'Scrape error'],
  };
  const [cls, label] = map[kind];
  return <span className={`badge ${cls}`}>{label}</span>;
}

export default async function Dashboard() {
  const { settings, evaluations, lastScrapedAt } = await getDashboardData();

  const alerts = evaluations.filter(isAlerting);
  const above = evaluations.filter((e) => e.kind === 'above_rrp').length;
  const below = evaluations.filter((e) => e.kind === 'below_rrp').length;
  const errors = evaluations.filter((e) => e.kind === 'error').length;

  return (
    <>
      <h1>Dashboard</h1>
      <p className="muted">
        {lastScrapedAt
          ? `Last scrape: ${new Date(lastScrapedAt).toLocaleString('en-GB')}`
          : 'No scrape has run yet. Run the scraper job (or `npm run scrape`) to populate data.'}
        {' · '}Default threshold ±{settings.default_threshold_pct}% · Email mode: {settings.email_mode}
      </p>

      <div className="stat-grid" style={{ margin: '16px 0 24px' }}>
        <div className="stat"><div className="n">{evaluations.length}</div><div className="l">Listings</div></div>
        <div className="stat"><div className="n" style={{ color: 'var(--danger)' }}>{above}</div><div className="l">Above RRP</div></div>
        <div className="stat"><div className="n" style={{ color: 'var(--warn)' }}>{below}</div><div className="l">Below RRP</div></div>
        <div className="stat"><div className="n" style={{ color: 'var(--muted)' }}>{errors}</div><div className="l">Errors</div></div>
      </div>

      <div className="card">
        <h2>{alerts.length ? `Alerts (${alerts.length})` : 'All monitored prices'}</h2>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Dealer</th>
              <th className="num">RRP</th>
              <th className="num">Current price</th>
              <th className="num">Δ vs RRP</th>
              <th>Changed</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {evaluations.length === 0 && (
              <tr><td colSpan={7} className="muted">No active listings yet.</td></tr>
            )}
            {evaluations.map((e) => (
              <tr key={e.listing.id}>
                <td>
                  <strong>{e.product.name}</strong>
                  <div className="muted">{e.product.sku}</div>
                </td>
                <td>
                  {e.dealer.name}
                  <div><a href={e.listing.product_url} target="_blank" rel="noreferrer">page ↗</a></div>
                </td>
                <td className="num">{fmtMoney(e.product.rrp, e.currency)}</td>
                <td className="num">{fmtMoney(e.price, e.currency)}</td>
                <td className="num">{fmtPct(e.deviationPct)}</td>
                <td>{e.changedSinceYesterday ? '↕︎ yes' : '—'}</td>
                <td>{badge(e.kind)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
