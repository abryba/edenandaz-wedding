import { getServiceClient } from '@/lib/supabase';
import { saveRecipient, deleteRecipient } from '../actions';
import type { Recipient } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function RecipientsPage() {
  const db = getServiceClient();
  const { data } = await db.from('recipients').select('*').order('email');
  const recipients = (data as Recipient[]) ?? [];

  return (
    <>
      <h1>Alert Recipients</h1>
      <p className="muted">People in your organisation who receive the daily price report email.</p>

      <div className="card">
        <h2>Add recipient</h2>
        <form action={saveRecipient} className="row">
          <div className="field" style={{ flex: 1 }}><label>Email</label><input name="email" type="email" required style={{ width: '100%' }} /></div>
          <div className="field" style={{ flex: 1 }}><label>Name</label><input name="name" style={{ width: '100%' }} /></div>
          <div className="field"><label>Active</label><input name="active" type="checkbox" defaultChecked /></div>
          <button className="btn" type="submit">Add</button>
        </form>
      </div>

      <div className="card">
        <table>
          <thead><tr><th>Email</th><th>Name</th><th>Active</th><th></th></tr></thead>
          <tbody>
            {recipients.map((r) => (
              <tr key={r.id}>
                <td>
                  <form action={saveRecipient} id={`r-${r.id}`}>
                    <input type="hidden" name="id" value={r.id} />
                    <input name="email" type="email" defaultValue={r.email} style={{ width: '100%' }} />
                  </form>
                </td>
                <td><input name="name" defaultValue={r.name ?? ''} form={`r-${r.id}`} style={{ width: '100%' }} /></td>
                <td><input name="active" type="checkbox" defaultChecked={r.active} form={`r-${r.id}`} /></td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn secondary" form={`r-${r.id}`} type="submit">Save</button>{' '}
                  <form action={deleteRecipient} style={{ display: 'inline' }}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="btn danger" type="submit">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
            {recipients.length === 0 && <tr><td colSpan={4} className="muted">No recipients yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
