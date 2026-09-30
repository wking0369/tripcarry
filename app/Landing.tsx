'use client';

import Calculator from './Calculator';
import { useSite } from './Site';

export default function Landing() {
  const { t, lang, openWaitlist } = useSite();
  return (
    <main className="page">
      <section className="hero">
        <div>
          <span className="chip chip-ok" style={{ marginBottom: 14 }}>{t.badge}</span>
          <h1>
            {t.hero1a}
            <br />
            {t.hero1b}
            <em>{t.hero1em}</em>
            {t.hero1c}
          </h1>
          <p className="hero-sub">
            {t.hero2a}
            <em>{t.hero2em}</em>
            {t.hero2b}
          </p>
          <p className="hero-lead">{t.lead}</p>
          <div className="hero-cta">
            <button type="button" className="btn btn-primary" onClick={() => openWaitlist('buyer', 'hero_buyer')}>{t.ctaBuyer}</button>
            <button type="button" className="btn" onClick={() => openWaitlist('traveler', 'hero_traveler')}>{t.ctaTraveler}</button>
          </div>
          <p className="small muted" style={{ marginTop: 12 }}>{t.perk}</p>
        </div>
        <div id="how" className="card-flush flow-card" aria-label={t.howTitle}>
          {t.flow.map((f, i) => (
            <div key={f.title} className="flow-row">
              <span className="flow-num">{i + 1}</span>
              <div>
                <strong>
                  {f.title}
                  <span className={`who who-${f.who}`}>{t.who[f.who as keyof typeof t.who]}</span>
                </strong>
                <span>{f.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2>{t.whyTitle}</h2></div>
        <div className="grid-3">
          {t.why.map((w, i) => (
            <div key={w.eyebrow} className="card value">
              <span className="eyebrow">{w.eyebrow}</span>
              <h3>{w.title}</h3>
              <ul>
                {w.items.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              {i < 2 && (
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ marginTop: 14 }}
                  onClick={() => openWaitlist(i === 0 ? 'buyer' : 'traveler', i === 0 ? 'why_buyer' : 'why_traveler')}
                >
                  {i === 0 ? t.ctaBuyer : t.ctaTraveler}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2>{t.safetyTitle}</h2></div>
        <div className="grid-4">
          {t.safety.map((s) => (
            <div key={s.title} className="card value">
              <h3>{s.title}</h3>
              <p className="small muted">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="calc" className="section">
        <div className="section-head">
          <h2>{t.calcTitle}</h2>
          <span>{t.calcSub}</span>
        </div>
        <Calculator key={lang} lang={lang} />
      </section>

      <section className="section">
        <div className="section-head"><h2>{t.feesTitle}</h2></div>
        <div className="grid-3">
          {t.fees.map((f) => (
            <div key={f.label} className="card">
              <div className="stat-num">{f.big}</div>
              <div className="stat-label">{f.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="pitch final-cta">
        <div>
          <h2>{t.finalTitle}</h2>
          <p>{t.finalSub}</p>
        </div>
        <div className="hero-cta" style={{ marginTop: 0 }}>
          <button type="button" className="btn btn-primary" onClick={() => openWaitlist('buyer', 'final_buyer')}>{t.ctaBuyer}</button>
          <button type="button" className="btn btn-light" onClick={() => openWaitlist('traveler', 'final_traveler')}>{t.ctaTraveler}</button>
        </div>
      </section>
    </main>
  );
}
