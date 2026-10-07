'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LANGS, LANG_LABEL } from '@/lib/i18n';
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/mark.png" alt="" width={34} height={26} className="brand-logo" />
          <span>TripCarry</span>
        </Link>
        <span style={{ flex: 1 }} />
        {lang !== 'ja' && <Link className="tab hide-sm" href="/drops">{t.nav.drops}</Link>}
        <div className="lang-switch" role="group" aria-label="Language">
          {LANGS.map((l) => (
            <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}>
              {LANG_LABEL[l]}
            </button>
          ))}
        </div>
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
