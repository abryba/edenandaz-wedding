import { getServiceClient } from '@/lib/supabase';
import { saveDealer, deleteDealer } from '../actions';
import type { Dealer } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function DealersPage() {
  const db = getServiceClient();
  const { data } = await db.from('dealers').select('*').order('name');
  const dealers = (data as Dealer[]) ?? [];

  return (
    <>
      <h1>Dealers</h1>
      <p className="muted">The dealer / reseller websites you monitor.</p>

      <div className="card">
        <h2>Add dealer</h2>
        <form action={saveDealer} className="row">
          <div className="field" style={{ flex: 1 }}><label>Name</label><input name="name" required style={{ width: '100%' }} /></div>
          <div className="field" style={{ flex: 1 }}><label>Website</label><input name="website" placeholder="https://" style={{ width: '100%' }} /></div>
          <div className="field"><label>Active</label><input name="active" type="checkbox" defaultChecked /></div>
          <button className="btn" type="submit">Add</button>
        </form>
      </div>

      <div className="card">
        <table>
          <thead><tr><th>Name</th><th>Website</th><th>Active</th><th></th></tr></thead>
          <tbody>
            {dealers.map((d) => (
              <tr key={d.id}>
                <td>
                  <form action={saveDealer} id={`d-${d.id}`}>
                    <input type="hidden" name="id" value={d.id} />
                    <input name="name" defaultValue={d.name} style={{ width: '100%' }} />
                  </form>
                </td>
                <td><input name="website" defaultValue={d.website ?? ''} form={`d-${d.id}`} style={{ width: '100%' }} /></td>
                <td><input name="active" type="checkbox" defaultChecked={d.active} form={`d-${d.id}`} /></td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn secondary" form={`d-${d.id}`} type="submit">Save</button>{' '}
                  <form action={deleteDealer} style={{ display: 'inline' }}>
                    <input type="hidden" name="id" value={d.id} />
                    <button className="btn danger" type="submit">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
            {dealers.length === 0 && <tr><td colSpan={4} className="muted">No dealers yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
