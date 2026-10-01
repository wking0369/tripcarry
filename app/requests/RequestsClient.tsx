'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CATEGORIES, CATEGORY_LIST, COUNTRIES, evaluate, fmtKRW, type Category, type CountryCode } from '@/lib/customs';
import { actions, breakdown, useP2P } from '@/lib/store';
import { CountrySelect, GuardPanel, Loading, Money, Route, StatusChip, usd } from '../ui';

const EMPTY_FORM = {
  buyer: '',
  title: '',
  link: '',
  category: 'general' as Category,
  qty: '1',
  unit: '',
  reward: '',
  from: 'US' as CountryCode,
  to: 'KR' as CountryCode,
  toCity: '',
  neededBy: '',
  note: '',
  agree: false,
  acceptDuty: false,
};

export default function RequestsClient() {
  const s = useP2P();
  const [f, setF] = useState(EMPTY_FORM);
  const [filter, setFilter] = useState<'open' | 'all'>('open');
  const [done, setDone] = useState<string | null>(null);

  const qty = Math.max(1, Number(f.qty) || 1);
  const unitUSD = Math.max(0, Number(f.unit) || 0);
  const rewardUSD = Math.max(0, Number(f.reward) || 0);
  const guard = evaluate({ to: f.to, items: [{ name: f.title, category: f.category, unitUSD, qty }] });
  const bd = breakdown({ unitUSD, qty, rewardUSD, dutyUSD: 0 });
  const missing = !f.buyer.trim() || !f.title.trim() || unitUSD <= 0 || rewardUSD <= 0;
  const sameCountry = f.from === f.to;
  const needsDuty = guard.zone !== 'block' && guard.excessUSD > 0;
  const canSubmit = !missing && !sameCountry && guard.zone !== 'block' && f.agree && (!needsDuty || f.acceptDuty);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    actions.addRequest({
      buyer: f.buyer.trim(),
      title: f.title.trim(),
      link: f.link.trim(),
      category: f.category,
      qty,
      unitUSD,
      rewardUSD,
      from: f.from,
      to: f.to,
      toCity: f.toCity.trim(),
      neededBy: f.neededBy,
      dutyUSD: needsDuty ? guard.estDutyUSD : 0,
      note: f.note.trim(),
    });
    setDone(f.title.trim());
    setF({ ...EMPTY_FORM, buyer: f.buyer, from: f.from, to: f.to, toCity: f.toCity });
  };

  const list = s.requests.filter((r) => (filter === 'open' ? r.status === 'open' : true));

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1>구매 요청</h1>
          <p>사고 싶은 물건을 올리면 그 나라에서 오는 여행자가 수락해요. 매칭되기 전에는 결제되지 않아요.</p>
        </div>
      </div>

      <div className="split">
        <section className="section">
          <div className="section-head">
            <h2>{filter === 'open' ? '여행자를 기다리는 요청' : '전체 요청'}</h2>
            <div className="pills">
              <button type="button" className="pill btn-sm" aria-pressed={filter === 'open'} onClick={() => setFilter('open')}>대기 중</button>
              <button type="button" className="pill btn-sm" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>전체</button>
            </div>
          </div>
          {!s.ready ? (
            <Loading />
          ) : list.length === 0 ? (
            <div className="card empty">아직 요청이 없어요. 오른쪽에서 첫 요청을 올려 보세요.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {list.map((r) => {
                const b = breakdown(r);
                return (
                  <article key={r.id} className="card req-card">
                    <div className="req-head">
                      <div className="grow">
                        <div className="req-title">{r.title}</div>
                        <div style={{ marginTop: 6, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                          <Route from={r.from} to={r.to} toCity={r.toCity} />
                          <span className="chip chip-neutral">{CATEGORIES[r.category].label}</span>
                        </div>
                      </div>
                      <StatusChip status={r.status} />
                    </div>
                    <div className="kv">
                      <span>물품 <b>{usd(b.item)}</b>{r.qty > 1 && ` (${usd(r.unitUSD)} × ${r.qty})`}</span>
                      <span>보상금 <b className="reward">{usd(r.rewardUSD)}</b></span>
                      <span>요청자 <b>{r.buyer}</b></span>
                      {r.neededBy && <span>희망일 <b>{r.neededBy}</b>까지</span>}
                    </div>
                    {r.note && <p className="small muted">“{r.note}”</p>}
                    {r.status !== 'open' && (
                      <Link className="small" href="/orders">거래 현황에서 보기 →</Link>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <form className="card sticky" onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600 }}>새 구매 요청</h2>
          {done && <div className="notice notice-ok">“{done}” 요청을 올렸어요. 여행자가 수락하면 거래 현황에 나타나요.</div>}
          <div className="field">
            <label htmlFor="rq-buyer">내 이름(닉네임)</label>
            <input id="rq-buyer" className="input" value={f.buyer} onChange={(e) => set('buyer', e.target.value)} placeholder="예: 제이슨" />
          </div>
          <div className="field">
            <label htmlFor="rq-title">물품 이름</label>
            <input id="rq-title" className="input" value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="예: 르 라보 상탈 33 50ml" />
          </div>
          <div className="field">
            <label htmlFor="rq-link">상품 링크</label>
            <input id="rq-link" className="input" type="url" value={f.link} onChange={(e) => set('link', e.target.value)} placeholder="https://" />
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="rq-from">구매 국가</label>
              <CountrySelect id="rq-from" value={f.from} onChange={(v) => set('from', v)} />
            </div>
            <div className="field">
              <label htmlFor="rq-to">받을 국가</label>
              <CountrySelect id="rq-to" value={f.to} onChange={(v) => set('to', v)} />
            </div>
            <div className="field">
              <label htmlFor="rq-city">받을 도시</label>
              <input id="rq-city" className="input" value={f.toCity} onChange={(e) => set('toCity', e.target.value)} placeholder={COUNTRIES[f.to].code === 'KR' ? '서울' : ''} />
            </div>
            <div className="field">
              <label htmlFor="rq-date">희망 수령일</label>
              <input id="rq-date" className="input" type="date" value={f.neededBy} onChange={(e) => set('neededBy', e.target.value)} />
            </div>
            <div className="field span-2">
              <label htmlFor="rq-cat">종류</label>
              <select id="rq-cat" className="select" value={f.category} onChange={(e) => set('category', e.target.value as Category)}>
                {CATEGORY_LIST.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="rq-unit">단가 (USD)</label>
              <input id="rq-unit" className="input" inputMode="decimal" value={f.unit} onChange={(e) => set('unit', e.target.value)} placeholder="230" />
            </div>
            <div className="field">
              <label htmlFor="rq-qty">수량</label>
              <input id="rq-qty" className="input" inputMode="numeric" value={f.qty} onChange={(e) => set('qty', e.target.value)} />
            </div>
            <div className="field span-2">
              <label htmlFor="rq-reward">여행자 보상금 (USD)</label>
              <input id="rq-reward" className="input" inputMode="decimal" value={f.reward} onChange={(e) => set('reward', e.target.value)} placeholder="보통 물품가의 10~20%" />
            </div>
            <div className="field span-2">
              <label htmlFor="rq-note">여행자에게 한마디</label>
              <textarea id="rq-note" className="textarea" rows={2} value={f.note} onChange={(e) => set('note', e.target.value)} />
            </div>
          </div>

          {sameCountry ? (
            <div className="notice notice-warn">구매 국가와 받을 국가가 같아요. 국가 간 요청만 올릴 수 있어요.</div>
          ) : (
            (unitUSD > 0 || guard.zone === 'block') && <GuardPanel result={guard} />
          )}

          {unitUSD > 0 && guard.zone !== 'block' && (
            <div className="breakdown">
              <div><span>물품 금액</span><span>{usd(bd.item)}</span></div>
              <div><span>여행자 보상금</span><span>{usd(rewardUSD)}</span></div>
              <div><span>서비스 수수료</span><span>{usd(bd.buyerFee)}</span></div>
              {guard.estDutyUSD > 0 && (
                <div className="muted-row"><span>예상 세금 (구매자 부담)</span><span>{usd(guard.estDutyUSD)}</span></div>
              )}
              <div className="total">
                <span>매칭 후 결제할 금액</span>
                <span><Money value={bd.buyerPays + guard.estDutyUSD} /> <span className="muted small">≈ {fmtKRW(bd.buyerPays + guard.estDutyUSD)}</span></span>
              </div>
            </div>
          )}

          {needsDuty && (
            <label className="check duty-accept">
              <input type="checkbox" checked={f.acceptDuty} onChange={(e) => set('acceptDuty', e.target.checked)} />
              <span className="small">
                면세 한도를 넘어요. 예상 세금 <b>{usd(guard.estDutyUSD)}</b>를 제가 부담하는 데 동의해요. (동의해야 다음 단계로 넘어가요)
              </span>
            </label>
          )}

          <label className="check">
            <input type="checkbox" checked={f.agree} onChange={(e) => set('agree', e.target.checked)} />
            <span className="small">
              정품·합법 물품이며, <Link href="/rules" target="_blank">구매 전 확인 사항</Link>과{' '}
              <Link href="/terms" target="_blank">이용약관</Link>에 동의해요.
            </span>
          </label>

          <button className="btn btn-primary" type="submit" disabled={!canSubmit}>
            {guard.zone === 'block' ? '반입 금지 품목이라 등록할 수 없어요' : needsDuty && !f.acceptDuty ? '예상 세금에 동의해야 해요' : '요청 올리기'}
          </button>
        </form>
      </div>
    </main>
  );
}
