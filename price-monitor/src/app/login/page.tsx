import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

async function login(formData: FormData) {
  'use server';
  const entered = String(formData.get('password') || '');
  const from = String(formData.get('from') || '/');
  if (entered && entered === process.env.ADMIN_PASSWORD) {
    cookies().set('pm_auth', entered, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    redirect(from.startsWith('/') ? from : '/');
  }
  redirect('/login?error=1');
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { from?: string; error?: string };
}) {
  return (
    <div className="card" style={{ maxWidth: 360, margin: '80px auto' }}>
      <h2>Sign in</h2>
      <form action={login}>
        <input type="hidden" name="from" value={searchParams.from || '/'} />
        <div className="field" style={{ marginBottom: 12 }}>
          <label>Admin password</label>
          <input type="password" name="password" autoFocus required />
        </div>
        {searchParams.error && (
          <p style={{ color: 'var(--danger)', fontSize: 13 }}>Incorrect password.</p>
        )}
        <button className="btn" type="submit">Sign in</button>
      </form>
    </div>
  );
}
