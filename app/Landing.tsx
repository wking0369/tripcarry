'use client';

import Link from 'next/link';
import { DROPS } from '@/lib/drops';
import DropCard, { NotListedCard } from './DropCard';
import { useSite } from './Site';

const ICONS: Record<string, React.ReactNode> = {
  plane: <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />,
  bag: <path d="M5 8h14l-1 12H6L5 8zM9 8V6a3 3 0 0 1 6 0v2" />,
  coin: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9 9h4.5a2 2 0 0 1 0 4H9m0-4v8m0-4h5" />,
};

export default function Landing() {
  const { t, lang, openWaitlist } = useSite();
  const max = Math.max(...t.compare.map((c) => c.value));
  const reverse = lang === 'ja'; // 일본어 방문자는 서울 → 도쿄 구매자

  return (
    <main className="page lp">
      <section className="lp-hero">
        <span className="chip chip-ok">{t.badge}</span>
        <h1>
          {t.h1a}
          <br />
          <em>{t.h1b}</em>
        </h1>
        <p className="lp-sub">{t.sub}</p>
        <div className="lp-cta">
          <button type="button" className="btn btn-primary btn-lg" onClick={() => openWaitlist('buyer', 'hero_buyer')}>{t.ctaBuyer}</button>
          <button type="button" className="btn btn-lg" onClick={() => openWaitlist('traveler', 'hero_traveler')}>{t.ctaTraveler}</button>
        </div>
        <p className="lp-perk">🎁 {t.perk}</p>
      </section>

      {reverse ? (
        <section className="section">
          <div className="drops drops-one">
            <NotListedCard />
          </div>
        </section>
      ) : (
        <section className="section">
          <div className="section-head">
            <div>
              <h2 className="lp-h2">{t.dropsTitle}</h2>
              <p className="small muted">{t.dropsSub}</p>
            </div>
            <Link href="/drops" className="lp-more">{t.dropsAll}</Link>
          </div>
          <div className="drops">
            {DROPS.slice(0, 3).map((d) => <DropCard key={d.id} drop={d} />)}
            <NotListedCard />
          </div>
          <p className="tiny muted">{t.dropsSample}</p>
        </section>
      )}

      <section className="card lp-compare">
        <h2>{t.compareTitle}</h2>
        <div className="lp-bars">
          {t.compare.map((c) => (
            <div key={c.label} className={`lp-bar${c.best ? ' best' : ''}${c.value ? '' : ' na'}`}>
              <div className="lp-bar-label">
                <strong>{c.label}</strong>
                <span>{c.note}</span>
              </div>
              <div className="lp-bar-track">
                {c.value ? <span style={{ width: `${(c.value / max) * 100}%` }}>{c.shown}</span> : <em>✕ {c.shown}</em>}
              </div>
            </div>
          ))}
        </div>
        <p className="tiny muted">{t.compareNote}</p>
      </section>

      <section className="section">
        <h2 className="lp-h2">{t.stepsTitle}</h2>
        <ol className="lp-steps">
          {t.steps.map((s, i) => (
            <li key={s.title}>
              <span className="lp-step-num">{i + 1}</span>
              <strong>{s.title}</strong>
              <span>{s.desc}</span>
            </li>
          ))}
        </ol>
        <ul className="lp-trust">
          {t.trust.map((x) => <li key={x}>{x}</li>)}
        </ul>
      </section>

      <section className="card lp-supply">
        <div>
          <h2 className="lp-h2">{t.supplyTitle}</h2>
          <p className="muted">{t.supplySub}</p>
        </div>
        <div className="lp-benefits">
          {t.supply.map((b) => (
            <div key={b.title} className="lp-benefit">
              <span className="lp-icon"><svg viewBox="0 0 24 24" aria-hidden="true">{ICONS[b.icon]}</svg></span>
              <strong>{b.title}</strong>
              <span>{b.desc}</span>
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-primary" onClick={() => openWaitlist('traveler', 'supply_section')}>{t.supplyCta}</button>
      </section>

      <section className="pitch final-cta">
        <div>
          <h2>{t.finalTitle}</h2>
          <p>{t.finalSub}</p>
        </div>
        <div className="lp-cta" style={{ marginTop: 0 }}>
          <button type="button" className="btn btn-primary" onClick={() => openWaitlist('buyer', 'final_buyer')}>{t.ctaBuyer}</button>
          <button type="button" className="btn btn-light" onClick={() => openWaitlist('traveler', 'final_traveler')}>{t.ctaTraveler}</button>
        </div>
      </section>
    </main>
  );
}
