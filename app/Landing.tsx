'use client';

import { useCallback, useEffect, useState } from 'react';
import { COPY, SURVEY_URL, WECHAT_ID, type Lang } from '@/lib/landing-copy';

function readLang(): Lang {
  const h = typeof window === 'undefined' ? '' : window.location.hash.slice(1);
  if (h === 'ko' || h === 'zh') return h;
  try {
    const s = localStorage.getItem('lang');
    if (s === 'ko' || s === 'zh') return s;
  } catch {}
  return 'zh';
}

export default function Landing() {
  const [lang, setLangState] = useState<Lang>('zh');
  const [copied, setCopied] = useState(false);
  const t = (k: string) => COPY[lang][k] ?? '';
  const html = (k: string) => ({ __html: COPY[lang][k] ?? '' });

  useEffect(() => {
    setLangState(readLang());
    const onHash = () => {
      const h = window.location.hash.slice(1);
      if (h === 'ko' || h === 'zh') setLangState(h);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'ko';
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem('lang', l); } catch {}
    if (window.location.hash !== '#' + l) history.replaceState(null, '', '#' + l);
  }, []);

  const copy = () => {
    const done = () => { setCopied(true); setTimeout(() => setCopied(false), 1600); };
    const fallback = () => {
      const el = document.getElementById('wechat-id');
      if (!el) return;
      const r = document.createRange(); r.selectNodeContents(el);
      const s = getSelection(); s?.removeAllRanges(); s?.addRange(r);
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(WECHAT_ID).then(done).catch(fallback);
    else fallback();
  };

  return (
    <div className="lp">
      <header className="wrap top">
        <div className="brand"><span className="brand-mark">中→한</span><span>{t('brand')}</span></div>
        <div className="lang" role="group" aria-label="Language">
          <button type="button" aria-pressed={lang === 'zh'} onClick={() => setLang('zh')}>中文</button>
          <button type="button" aria-pressed={lang === 'ko'} onClick={() => setLang('ko')}>한국어</button>
        </div>
      </header>

      <main>
        <div className="wrap hero">
          <div>
            <span className="eyebrow">{t('eyebrow')}</span>
            <h1 dangerouslySetInnerHTML={html('h1')} />
            <p className="sub">{t('sub')}</p>
            <div className="cta-row">
              <a className="btn btn-primary" href="#contact">{t('cta')}</a>
              <a className="btn btn-ghost" href="#sample">{t('cta2')}</a>
            </div>
          </div>
          <aside className="offer" aria-labelledby="offer-label">
            <div className="seal" dangerouslySetInnerHTML={html('seal')} />
            <div className="offer-label" id="offer-label">{t('offerLabel')}</div>
            <div className="price"><b>₩400,000</b><span>{t('offerUnit')}</span></div>
            <ul>
              <li>{t('o1')}</li>
              <li>{t('o2')}</li>
              <li>{t('o3')}</li>
            </ul>
            <p className="note">{t('offerNote')}</p>
          </aside>
        </div>

        <section className="block" id="sample">
          <div className="wrap">
            <div className="sec-head">
              <span className="kicker">{t('sampleKicker')}</span>
              <h2>{t('sampleTitle')}</h2>
              <p>{t('sampleDesc')}</p>
            </div>
            <div className="sample">
              <figure>
                <span className="tag">{t('tagXhs')}</span>
                <div className="shot xhs" role="img" aria-label="小红书原图示例">
                  <div className="txt zh">
                    <span className="pill">北京 VLOG</span>
                    <span className="t1">北京胡同<br />周末慢逛路线</span>
                    <span className="t2">3 家本地人才知道的小店</span>
                  </div>
                </div>
              </figure>
              <div className="arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h15M13 6l6 6-6 6" /></svg>
                <span>中→한</span>
              </div>
              <figure>
                <span className="tag">{t('tagIg')}</span>
                <div className="shot ig" role="img" aria-label="Instagram 韩语版示例">
                  <div className="txt ko">
                    <span className="pill">베이징 브이로그</span>
                    <span className="t1">베이징 후통<br />주말 산책 코스</span>
                    <span className="t2">현지인만 아는 가게 3곳</span>
                  </div>
                </div>
              </figure>
            </div>
            <div className="review">
              <div>
                <small>{t('capLabel')}</small>
                <p className="ko">주말에 베이징 간다면 여기부터 걸어보세요. 관광객 말고 동네 사람들이 가는 가게만 골랐어요. <span className="hash">#베이징여행 #후통 #중국여행</span></p>
              </div>
              <div>
                <small>{t('backLabel')}</small>
                <p className="zh">周末去北京的话，先从这里走起。只挑了本地人常去的店，不是游客店。#北京旅行 #胡同 #中国旅行</p>
              </div>
            </div>
            <p className="demo-note">{t('demoNote')}</p>
          </div>
        </section>

        <section className="block">
          <div className="wrap">
            <div className="sec-head">
              <span className="kicker">{t('svcKicker')}</span>
              <h2>{t('svcTitle')}</h2>
              <p>{t('svcDesc')}</p>
            </div>
            <ul className="svc">
              {['s1', 's2', 's3', 's4', 's5'].map((k) => (
                <li key={k}><h3>{t(k + 't')}</h3><p>{t(k + 'd')}</p></li>
              ))}
            </ul>
            <p className="more">{t('svcMore')}</p>
          </div>
        </section>

        <section className="block">
          <div className="wrap">
            <div className="sec-head">
              <span className="kicker">{t('procKicker')}</span>
              <h2>{t('procTitle')}</h2>
              <p>{t('procDesc')}</p>
            </div>
            <ol className="steps">
              {['p1', 'p2', 'p3', 'p4', 'p5'].map((k) => (
                <li key={k}><div><h3>{t(k + 't')}</h3><p>{t(k + 'd')}</p></div></li>
              ))}
            </ol>
          </div>
        </section>

        <section className="block">
          <div className="wrap">
            <div className="sec-head">
              <span className="kicker">{t('whyKicker')}</span>
              <h2>{t('whyTitle')}</h2>
            </div>
            <div className="why">
              <div className="stat">
                <b>{t('statNum')}</b>
                <p>{t('statText')}</p>
              </div>
              <div className="points">
                <div><h3>{t('w1t')}</h3><p>{t('w1d')}</p></div>
                <div><h3>{t('w2t')}</h3><p>{t('w2d')}</p></div>
              </div>
            </div>
          </div>
        </section>

        <section className="block">
          <div className="wrap">
            <div className="sec-head">
              <span className="kicker">{t('scopeKicker')}</span>
              <h2>{t('scopeTitle')}</h2>
            </div>
            <div className="scope">
              <div>
                <h3>{t('oursT')}</h3>
                <ul>{['ours1', 'ours2', 'ours3'].map((k) => <li key={k}>{t(k)}</li>)}</ul>
              </div>
              <div>
                <h3>{t('yoursT')}</h3>
                <ul>{['yours1', 'yours2', 'yours3'].map((k) => <li key={k}>{t(k)}</li>)}</ul>
              </div>
            </div>
            <p className="fine">{t('scopeNote')}</p>
          </div>
        </section>

        <section className="block">
          <div className="wrap">
            <div className="sec-head">
              <span className="kicker">{t('pilotKicker')}</span>
              <h2>{t('pilotTitle')}</h2>
            </div>
            <dl className="terms">
              <div><dt>{t('t1k')}</dt><dd>{t('t1v')}</dd></div>
              <div><dt>{t('t2k')}</dt><dd className="hl">₩400,000</dd></div>
              <div><dt>{t('t3k')}</dt><dd>{t('t3v')}</dd></div>
              <div><dt>{t('t4k')}</dt><dd>{t('t4v')}</dd></div>
              <div><dt>{t('t5k')}</dt><dd>{t('t5v')}</dd></div>
            </dl>
          </div>
        </section>

        <section className="block" id="contact">
          <div className="wrap">
            <div className="contact">
              <div>
                <h2>{t('ctTitle')}</h2>
                <p>{t('ctDesc')}</p>
              </div>
              <div className="apply">
                <a className="btn btn-primary" href={SURVEY_URL} target="_blank" rel="noopener noreferrer">{t('survey')}</a>
                <div className="wechat">
                  <div className="grow"><small>{t('wxLabel')}</small><strong id="wechat-id">{WECHAT_ID}</strong></div>
                  <button type="button" className="copy" onClick={copy}>{copied ? t('copied') : t('copy')}</button>
                </div>
                <p className="who">{t('who')}</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="wrap">© 2026 Park Hyunwook</footer>

      <div className="bar">
        <div className="bp"><b>₩400,000</b><small>{t('barNote')}</small></div>
        <a className="btn btn-primary" href="#contact">{t('cta')}</a>
      </div>
    </div>
  );
}
