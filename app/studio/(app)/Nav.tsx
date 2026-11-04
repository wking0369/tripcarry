'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/studio', label: '분석' },
  { href: '/studio/data', label: '수치 입력' },
  { href: '/studio/archive', label: '보관함' },
  { href: '/studio/trial', label: '트라이얼' },
  { href: '/studio/subtitles', label: '자막 편집' },
  { href: '/studio/people', label: '인물·카드뉴스' },
  { href: '/studio/reports', label: '2주 보고서' },
  { href: '/studio/leads', label: '파일럿 신청' },
];

export default function Nav({ pending, leads }: { pending: number; leads: number }) {
  const path = usePathname();
  return (
    <nav className="hub-nav" aria-label="메뉴">
      {ITEMS.map((i) => {
        const on = i.href === '/studio' ? path === '/studio' : path.startsWith(i.href);
        const count = i.href === '/studio/trial' ? pending : i.href === '/studio/leads' ? leads : 0;
        return (
          <Link key={i.href} href={i.href} aria-current={on ? 'page' : undefined}>
            {i.label}
            {count > 0 && <span className="count">{count}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
