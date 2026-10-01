'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { DICT, LANG_COOKIE, type Dict, type Lang } from '@/lib/i18n';
import WaitlistModal from './WaitlistModal';

type Role = 'buyer' | 'traveler' | 'both';

interface SiteCtx {
  lang: Lang;
  t: Dict;
  setLang: (l: Lang) => void;
  openWaitlist: (role: Role, cta: string, preset?: { from?: string; to?: string }) => void;
  visitor: () => { vid: string; src: string };
}

const Ctx = createContext<SiteCtx | null>(null);

export function useSite() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useSite outside SiteProvider');
  return c;
}

function store(key: string, value?: string) {
  try {
    if (value !== undefined) localStorage.setItem(key, value);
    return localStorage.getItem(key) ?? '';
  } catch {
    return value ?? '';
  }
}

/** 브라우저마다 임의 ID(vid) 하나, 유입 경로(src)는 ?src= 또는 utm_source로 받은 마지막 값을 기억한다. */
function readVisitor() {
  let vid = store('tc_vid');
  if (!vid) vid = store('tc_vid', Math.random().toString(36).slice(2, 12) + Date.now().toString(36));
  const q = new URLSearchParams(window.location.search);
  const fromUrl = (q.get('src') || q.get('utm_source') || '').trim().slice(0, 60);
  let src = fromUrl ? store('tc_src', fromUrl) : store('tc_src');
  if (!src) {
    const ref = document.referrer;
    src = /reddit\.com/i.test(ref) ? 'reddit (untagged)' : ref && !ref.includes(window.location.host) ? 'other site' : 'direct';
  }
  return { vid, src };
}

function send(body: object) {
  const data = JSON.stringify(body);
  try {
    if (navigator.sendBeacon?.('/api/track', new Blob([data], { type: 'application/json' }))) return;
  } catch {
    /* fetch로 대신 보낸다 */
  }
  fetch('/api/track', { method: 'POST', headers: { 'content-type': 'application/json' }, body: data, keepalive: true }).catch(() => {});
}

export function track(type: 'visit' | 'cta' | 'modal_open', extra: { cta?: string } = {}, lang: Lang = 'en') {
  if (typeof window === 'undefined') return;
  const { vid, src } = readVisitor();
  send({ type, vid, src, lang, path: window.location.pathname, ref: document.referrer ? new URL(document.referrer).host : '', ...extra });
}

export default function SiteProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [modal, setModal] = useState<{ role: Role; from?: string; to?: string } | null>(null);
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (path.startsWith('/admin') || path.startsWith('/studio') || lastPath.current === path) return;
    lastPath.current = path;
    track('visit', {}, lang);
  }, [path, lang]);

  const setLang = useCallback(
    (l: Lang) => {
      document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
      router.refresh();
    },
    [router],
  );

  const openWaitlist = useCallback(
    (role: Role, cta: string, preset?: { from?: string; to?: string }) => {
      track('cta', { cta }, lang);
      setModal({ role, ...preset });
    },
    [lang],
  );

  const visitor = useCallback(() => readVisitor(), []);

  return (
    <Ctx.Provider value={{ lang, t: DICT[lang], setLang, openWaitlist, visitor }}>
      {children}
      {modal && <WaitlistModal initialRole={modal.role} initialFrom={modal.from} initialTo={modal.to} onClose={() => setModal(null)} />}
    </Ctx.Provider>
  );
}
