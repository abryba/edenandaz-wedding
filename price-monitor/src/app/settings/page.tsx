import { getServiceClient } from '@/lib/supabase';
import { saveSettings } from '../actions';
import type { Settings } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const db = getServiceClient();
  const { data } = await db.from('settings').select('*').eq('id', 1).single();
  const s = data as Settings;

  return (
    <>
      <h1>Settings</h1>
      <p className="muted">Global defaults for alerting and the daily email.</p>

      <div className="card" style={{ maxWidth: 540 }}>
        <form action={saveSettings}>
          <div className="field" style={{ marginBottom: 14 }}>
            <label>Currency (ISO code)</label>
            <input name="currency" defaultValue={s.currency} />
          </div>
          <div className="field" style={{ marginBottom: 14 }}>
            <label>Default deviation threshold (%)</label>
            <input name="default_threshold_pct" type="number" step="0.1" defaultValue={s.default_threshold_pct} />
            <span className="muted">Alert fires when a dealer&apos;s price is more than this % above OR below RRP (unless a product overrides it).</span>
          </div>
          <div className="field" style={{ marginBottom: 14 }}>
            <label>Email mode</label>
            <select name="email_mode" defaultValue={s.email_mode}>
              <option value="alerts_only">Only email when there are alerts</option>
              <option value="always">Always send a daily summary</option>
            </select>
          </div>
          <div className="field" style={{ marginBottom: 18 }}>
            <label>Email subject prefix</label>
            <input name="email_subject_prefix" defaultValue={s.email_subject_prefix} />
          </div>
          <button className="btn" type="submit">Save settings</button>
        </form>
      </div>

      <div className="card" style={{ maxWidth: 540 }}>
        <h2>Scheduling</h2>
        <p className="muted">
          The daily scrape runs via GitHub Actions (<code>.github/workflows/price-monitor-daily.yml</code>).
          Adjust the cron schedule there. You can also trigger it manually from the Actions tab, or run
          <code> npm run scrape</code> locally.
        </p>
      </div>
    </>
  );
}
