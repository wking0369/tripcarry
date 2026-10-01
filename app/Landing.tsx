'use client';

import Link from 'next/link';
import { AutoRules } from './RulesVisual';
import { useSite } from './Site';

function flag(code: string) {
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

const ICONS: Record<string, React.ReactNode> = {
  globe: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
    </svg>
  ),
  box: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9z" />
      <path d="M3 7.5 12 12l9-4.5M12 12v9" />
      <path d="M4 4l16 16" className="strike" />
    </svg>
  ),
  tag: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 12V4h8l10 10-8 8L3 12z" />
      <circle cx="7.5" cy="8.5" r="1.5" />
    </svg>
  ),
};

export default function Landing() {
  const { t, lang, openWaitlist } = useSite();
  const max = Math.max(...t.compare.map((c) => c.value));

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

      <section className="lp-benefits">
        {t.benefits.map((b, i) => (
          <div key={b.title} className="lp-benefit">
            <span className="lp-num">{i + 1}</span>
            <span className="lp-icon">{ICONS[b.icon]}</span>
            <strong>{b.title}</strong>
            <span>{b.desc}</span>
          </div>
        ))}
      </section>

      <section className="card lp-compare">
        <h2>{t.compareTitle}</h2>
        <div className="lp-bars">
          {t.compare.map((c) => (
            <div key={c.label} className={`lp-bar${c.best ? ' best' : ''}`}>
              <div className="lp-bar-label">
                <strong>{c.label}</strong>
                <span>{c.note}</span>
              </div>
              <div className="lp-bar-track">
                <span style={{ width: `${(c.value / max) * 100}%` }}>{c.shown}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="tiny muted">{t.compareNote}</p>
      </section>

      <section className="section">
        <h2 className="lp-h2">{t.routesTitle}</h2>
        <div className="grid-2">
          {t.routes.map((r, i) => (
            <div key={r.title} className="card lp-route">
              <div className="lp-flags" aria-hidden="true">
                <span>{r.from.map(flag).join(' ')}</span>
                <span className="lp-arrow">→</span>
                <span>{r.to.map(flag).join(' ')}</span>
              </div>
              <h3>{r.title}</h3>
              <div className="lp-chips">
                {r.items.map((x) => (
                  <span key={x} className="chip chip-neutral">{x}</span>
                ))}
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => openWaitlist('buyer', i === 0 ? 'route_eu_kr' : 'route_kr_asia', { from: r.from[0], to: r.to.length === 1 ? r.to[0] : '' })}
              >
                {r.cta}
              </button>
            </div>
          ))}
        </div>
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
          {t.trust.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </section>

      <section className="section">
        <AutoRules lang={lang} />
        <Link href="/rules" className="lp-rules-link">{t.rulesCta}</Link>
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
