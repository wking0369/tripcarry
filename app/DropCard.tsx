'use client';

import { useEffect, useState } from 'react';
import type { Drop } from '@/lib/drops';
import { track, useSite } from './Site';

const SAVED = 'tc_wants';

function readSaved(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED) || '[]');
  } catch {
    return [];
  }
}

function won(n: number) {
  return `₩${n.toLocaleString('ko-KR')}`;
}

export default function DropCard({ drop }: { drop: Drop }) {
  const { t, lang, openWaitlist } = useSite();
  const [saved, setSaved] = useState(false);

  useEffect(() => setSaved(readSaved().includes(drop.id)), [drop.id]);

  const want = () => {
    if (!saved) {
      track('want', { cta: drop.id }, lang);
      try {
        localStorage.setItem(SAVED, JSON.stringify([...readSaved(), drop.id]));
      } catch {
        /* 저장이 막힌 브라우저 */
      }
      setSaved(true);
    }
    let joined = false;
    try {
      joined = localStorage.getItem('tc_joined') === '1';
    } catch {
      /* 저장이 막힌 브라우저 */
    }
    if (!joined) openWaitlist('buyer', 'drop_card', { route: 'JP-KR', item: drop.name[lang] });
  };

  return (
    <article className="drop">
      <div className="drop-art" style={{ background: drop.tone }} aria-hidden="true">
        <span>{drop.emoji}</span>
      </div>
      <span className={`drop-badge drop-${drop.badge}`}>{t.badges[drop.badge]}</span>
      <h3>{drop.name[lang]}</h3>
      <p className="drop-where">📍 {drop.where[lang]}</p>
      {drop.retail && drop.resale ? (
        <dl className="drop-price">
          <div><dt>{lang === 'ko' ? '매장 정가' : lang === 'ja' ? '店頭定価' : 'Retail'}</dt><dd>{won(drop.retail)}</dd></div>
          <div><dt>{lang === 'ko' ? '리셀 시세' : lang === 'ja' ? '転売相場' : 'Resale'}</dt><dd className="strike">{won(drop.resale)}</dd></div>
        </dl>
      ) : null}
      <button type="button" className={`btn ${saved ? 'btn-saved' : 'btn-primary'}`} onClick={want} aria-pressed={saved}>
        {saved ? t.wanted : t.want}
      </button>
    </article>
  );
}

export function NotListedCard() {
  const { t, lang, openWaitlist } = useSite();
  return (
    <article className="drop drop-empty">
      <div className="drop-art" aria-hidden="true"><span>＋</span></div>
      <h3>{t.notListed}</h3>
      <p className="drop-where">{t.notListedSub}</p>
      <button type="button" className="btn" onClick={() => openWaitlist('buyer', 'drop_custom', { route: lang === 'ja' ? 'KR-JP' : 'JP-KR' })}>
        {t.notListedCta}
      </button>
    </article>
  );
}
