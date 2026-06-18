'use server';

import { revalidatePath } from 'next/cache';
import { getServiceClient } from '@/lib/supabase';

// ---- Products --------------------------------------------------------------
export async function saveProduct(formData: FormData) {
  const db = getServiceClient();
  const id = formData.get('id') as string | null;
  const row = {
    sku: String(formData.get('sku') || '').trim(),
    name: String(formData.get('name') || '').trim(),
    rrp: Number(formData.get('rrp')),
    threshold_pct: formData.get('threshold_pct')
      ? Number(formData.get('threshold_pct'))
      : null,
    active: formData.get('active') === 'on',
  };
  if (id) await db.from('products').update(row).eq('id', id);
  else await db.from('products').insert(row);
  revalidatePath('/products');
}

export async function deleteProduct(formData: FormData) {
  const db = getServiceClient();
  await db.from('products').delete().eq('id', String(formData.get('id')));
  revalidatePath('/products');
}

// ---- Dealers ---------------------------------------------------------------
export async function saveDealer(formData: FormData) {
  const db = getServiceClient();
  const id = formData.get('id') as string | null;
  const row = {
    name: String(formData.get('name') || '').trim(),
    website: String(formData.get('website') || '').trim() || null,
    active: formData.get('active') === 'on',
  };
  if (id) await db.from('dealers').update(row).eq('id', id);
  else await db.from('dealers').insert(row);
  revalidatePath('/dealers');
}

export async function deleteDealer(formData: FormData) {
  const db = getServiceClient();
  await db.from('dealers').delete().eq('id', String(formData.get('id')));
  revalidatePath('/dealers');
}

// ---- Listings --------------------------------------------------------------
export async function saveListing(formData: FormData) {
  const db = getServiceClient();
  const id = formData.get('id') as string | null;
  const row = {
    product_id: String(formData.get('product_id')),
    dealer_id: String(formData.get('dealer_id')),
    product_url: String(formData.get('product_url') || '').trim(),
    css_selector: String(formData.get('css_selector') || '').trim() || null,
    active: formData.get('active') === 'on',
  };
  if (id) await db.from('listings').update(row).eq('id', id);
  else await db.from('listings').insert(row);
  revalidatePath('/listings');
}

export async function deleteListing(formData: FormData) {
  const db = getServiceClient();
  await db.from('listings').delete().eq('id', String(formData.get('id')));
  revalidatePath('/listings');
}

// ---- Recipients ------------------------------------------------------------
export async function saveRecipient(formData: FormData) {
  const db = getServiceClient();
  const id = formData.get('id') as string | null;
  const row = {
    email: String(formData.get('email') || '').trim(),
    name: String(formData.get('name') || '').trim() || null,
    active: formData.get('active') === 'on',
  };
  if (id) await db.from('recipients').update(row).eq('id', id);
  else await db.from('recipients').insert(row);
  revalidatePath('/recipients');
}

export async function deleteRecipient(formData: FormData) {
  const db = getServiceClient();
  await db.from('recipients').delete().eq('id', String(formData.get('id')));
  revalidatePath('/recipients');
}

// ---- Settings --------------------------------------------------------------
export async function saveSettings(formData: FormData) {
  const db = getServiceClient();
  await db
    .from('settings')
    .update({
      currency: String(formData.get('currency') || 'GBP').trim(),
      default_threshold_pct: Number(formData.get('default_threshold_pct')),
      email_mode: String(formData.get('email_mode')) === 'always' ? 'always' : 'alerts_only',
      email_subject_prefix: String(formData.get('email_subject_prefix') || '[Price Monitor]'),
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);
  revalidatePath('/settings');
}
