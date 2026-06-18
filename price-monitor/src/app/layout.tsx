import './globals.css';
import type { ReactNode } from 'react';
import { Nav } from './nav';

export const metadata = {
  title: 'Price Monitor',
  description: 'Daily dealer price monitoring vs RRP',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
