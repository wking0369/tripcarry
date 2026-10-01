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
        <Link href="/terms">{t.terms}</Link>
        <Link href="/privacy">{t.privacy}</Link>
        <Link href="/duty-free">{t.calc}</Link>
        <Link href="/requests">{t.preview}</Link>
      </p>
    </footer>
  );
}
