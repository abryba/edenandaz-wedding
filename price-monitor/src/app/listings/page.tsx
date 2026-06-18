import { getServiceClient } from '@/lib/supabase';
import { saveListing, deleteListing } from '../actions';
import type { Dealer, Listing, Product } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ListingsPage() {
  const db = getServiceClient();
  const [{ data: listings }, { data: products }, { data: dealers }] = await Promise.all([
    db.from('listings').select('*').order('created_at', { ascending: false }),
    db.from('products').select('*').order('sku'),
    db.from('dealers').select('*').order('name'),
  ]);
  const ls = (listings as Listing[]) ?? [];
  const ps = (products as Product[]) ?? [];
  const ds = (dealers as Dealer[]) ?? [];
  const pName = (id: string) => ps.find((p) => p.id === id);
  const dName = (id: string) => ds.find((d) => d.id === id);

  return (
    <>
      <h1>Listings</h1>
      <p className="muted">
        Each listing maps one product to one dealer&apos;s product page URL. The scraper auto-detects the
        price; add a CSS selector only if auto-detection fails for a site.
      </p>

      <div className="card">
        <h2>Add listing</h2>
        <form action={saveListing} className="row">
          <div className="field"><label>Product</label>
            <select name="product_id" required>
              {ps.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
            </select>
          </div>
          <div className="field"><label>Dealer</label>
            <select name="dealer_id" required>
              {ds.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="field" style={{ flex: 1 }}><label>Product URL</label>
            <input name="product_url" placeholder="https://dealer.com/product/..." required style={{ width: '100%' }} />
          </div>
          <div className="field"><label>CSS selector (optional)</label><input name="css_selector" placeholder=".price" /></div>
          <div className="field"><label>Active</label><input name="active" type="checkbox" defaultChecked /></div>
          <button className="btn" type="submit">Add</button>
        </form>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr><th>Product</th><th>Dealer</th><th>URL</th><th>Selector</th><th>Active</th><th></th></tr>
          </thead>
          <tbody>
            {ls.map((l) => (
              <tr key={l.id}>
                <td>
                  <form action={saveListing} id={`l-${l.id}`}>
                    <input type="hidden" name="id" value={l.id} />
                    <select name="product_id" defaultValue={l.product_id}>
                      {ps.map((p) => <option key={p.id} value={p.id}>{p.sku}</option>)}
                    </select>
                  </form>
                  <div className="muted">{pName(l.product_id)?.name}</div>
                </td>
                <td>
                  <select name="dealer_id" defaultValue={l.dealer_id} form={`l-${l.id}`}>
                    {ds.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </td>
                <td style={{ maxWidth: 260 }}>
                  <input name="product_url" defaultValue={l.product_url} form={`l-${l.id}`} style={{ width: '100%' }} />
                </td>
                <td><input name="css_selector" defaultValue={l.css_selector ?? ''} form={`l-${l.id}`} style={{ width: 90 }} /></td>
                <td><input name="active" type="checkbox" defaultChecked={l.active} form={`l-${l.id}`} /></td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn secondary" form={`l-${l.id}`} type="submit">Save</button>{' '}
                  <form action={deleteListing} style={{ display: 'inline' }}>
                    <input type="hidden" name="id" value={l.id} />
                    <button className="btn danger" type="submit">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
            {ls.length === 0 && <tr><td colSpan={6} className="muted">No listings yet. Add products and dealers first.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
