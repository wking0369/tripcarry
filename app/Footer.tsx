'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSite } from './Site';

export default function Footer() {
  const { t } = useSite();
  if (usePathname().startsWith('/admin')) return null;
  return (
    <footer className="p2p-footer">
      <p>{t.footer1}</p>
      <p>{t.footer2}</p>
      <p className="footer-links">
        <Link href="/privacy">{t.privacy}</Link>
        <Link href="/requests">{t.preview}</Link>
      </p>
    </footer>
  );
}
