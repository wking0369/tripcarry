'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSite } from './Site';

// 샘플 데이터로 동작하는 미리보기 화면들
const DEMO = [
  { href: '/requests', label: '구매 요청' },
  { href: '/trips', label: '여행 일정' },
  { href: '/orders', label: '거래 현황' },
  { href: '/customs', label: '면세 규정' },
];

export default function Nav() {
  const path = usePathname();
  const { t, lang, setLang, openWaitlist } = useSite();
  if (path.startsWith('/admin') || path.startsWith('/studio')) return null;
  const isDemo = DEMO.some((d) => d.href === path);

  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand" style={{ color: 'inherit', textDecoration: 'none' }}>
          <span className="brand-mark p2p-mark" aria-hidden="true">T</span>
          <span>TripCarry</span>
        </Link>
        <span style={{ flex: 1 }} />
        <Link className="tab hide-sm" href="/rules">{t.rules}</Link>
        <Link className="tab" href="/help">{t.help}</Link>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setLang(lang === 'en' ? 'ko' : 'en')}>
          {t.nav.other}
        </button>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => openWaitlist('buyer', 'nav')}>
          {t.nav.join}
        </button>
      </header>
      {isDemo && (
        <div className="demo-bar">
          <span className="chip chip-warn">미리보기</span>
          <span className="small">샘플 데이터로 동작하는 화면이에요. 실제 거래·사용자가 아니에요.</span>
          <nav className="demo-tabs" aria-label="미리보기 메뉴">
            {DEMO.map((d) => (
              <Link key={d.href} href={d.href} aria-current={path === d.href ? 'page' : undefined}>
                {d.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
