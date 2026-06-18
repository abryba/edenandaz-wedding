import { getServiceClient } from '@/lib/supabase';
import { saveProduct, deleteProduct } from '../actions';
import type { Product } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const db = getServiceClient();
  const { data } = await db.from('products').select('*').order('sku');
  const products = (data as Product[]) ?? [];

  return (
    <>
      <h1>Products &amp; RRP</h1>
      <p className="muted">Your catalogue and recommended retail price. Leave threshold blank to use the global default.</p>

      <div className="card">
        <h2>Add product</h2>
        <form action={saveProduct} className="row">
          <div className="field"><label>SKU</label><input name="sku" required /></div>
          <div className="field" style={{ flex: 1 }}><label>Name</label><input name="name" required style={{ width: '100%' }} /></div>
          <div className="field"><label>RRP</label><input name="rrp" type="number" step="0.01" required /></div>
          <div className="field"><label>Threshold % (optional)</label><input name="threshold_pct" type="number" step="0.1" /></div>
          <div className="field"><label>Active</label><input name="active" type="checkbox" defaultChecked /></div>
          <button className="btn" type="submit">Add</button>
        </form>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr><th>SKU</th><th>Name</th><th className="num">RRP</th><th className="num">Threshold</th><th>Active</th><th></th></tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  <form action={saveProduct} className="row" id={`p-${p.id}`}>
                    <input type="hidden" name="id" value={p.id} />
                    <input name="sku" defaultValue={p.sku} style={{ width: 90 }} />
                </form>
                </td>
                <td><input name="name" defaultValue={p.name} form={`p-${p.id}`} style={{ width: '100%' }} /></td>
                <td className="num"><input name="rrp" type="number" step="0.01" defaultValue={p.rrp} form={`p-${p.id}`} style={{ width: 90 }} /></td>
                <td className="num"><input name="threshold_pct" type="number" step="0.1" defaultValue={p.threshold_pct ?? ''} form={`p-${p.id}`} style={{ width: 70 }} /></td>
                <td><input name="active" type="checkbox" defaultChecked={p.active} form={`p-${p.id}`} /></td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn secondary" form={`p-${p.id}`} type="submit">Save</button>{' '}
                  <form action={deleteProduct} style={{ display: 'inline' }}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="btn danger" type="submit">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan={6} className="muted">No products yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
