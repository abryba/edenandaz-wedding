'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/products', label: 'Products & RRP' },
  { href: '/dealers', label: 'Dealers' },
  { href: '/listings', label: 'Listings' },
  { href: '/recipients', label: 'Recipients' },
  { href: '/settings', label: 'Settings' },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="nav">
      <span className="brand">📊 Price Monitor</span>
      {links.map((l) => (
        <Link key={l.href} href={l.href} className={path === l.href ? 'active' : ''}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
