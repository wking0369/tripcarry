'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/', label: '홈' },
  { href: '/requests', label: '구매 요청' },
  { href: '/trips', label: '여행 일정' },
  { href: '/orders', label: '거래 현황' },
  { href: '/customs', label: '면세 계산기' },
];

export default function Nav() {
  const path = usePathname();
  return (
    <header className="topbar">
      <Link href="/" className="brand" style={{ color: 'inherit', textDecoration: 'none' }}>
        <span className="brand-mark p2p-mark" aria-hidden="true">T</span>
        <span>TripCarry</span>
      </Link>
      <nav className="tabs" aria-label="TripCarry 메뉴">
        {TABS.map((t) => (
          <Link key={t.href} className="tab" href={t.href} aria-current={path === t.href ? 'page' : undefined}>
            {t.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
