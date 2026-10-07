'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CATEGORIES, CATEGORY_LIST, COUNTRIES, evaluate, fmtKRW, type Category, type CountryCode } from '@/lib/customs';
import { EXPRESS_SHIPPING, FEES, RESALE_SHARE, anchorPrice, rewardFor, suggestReward, type ItemSize } from '@/lib/fees';
import { actions, breakdown, demoNow, tripBlocked, useP2P, type Req } from '@/lib/store';
import { CountrySelect, GuardPanel, Loading, Route, StatusChip, usd } from '../ui';

const WAITS = [
  { days: 30, label: '1개월 이내', sub: '추천 · 제안을 가장 많이 받아요', rec: true },
  { days: 21, label: '3주 이내', sub: '조금 빠름 · 제안이 조금 적어요' },
  { days: 14, label: '2주 이내', sub: '가장 빠름 · 제안이 적어요' },
  { days: 60, label: '2개월 이내', sub: '느림 · 제안이 많아요' },
];

const EMPTY = {
  buyer: '',
  title: '',
  link: '',
  category: 'general' as Category,
  qty: 1,
  unit: '',
  packaging: 'nobox' as Req['packaging'],
  size: 'small' as ItemSize,
  details: '',
  from: 'JP' as CountryCode,
  to: 'KR' as CountryCode,
  toCity: '',
  waitDays: 30,
  /** 기본 보상금에 더 얹는 금액 (USD) */
  extra: 0,
  /** 같은 물건의 리셀 시세 (1개, USD) — 알면 추천 보상금을 보여 준다 */
  resale: '',
  note: '',
  agree: false,
  acceptDuty: false,
};

function addDays(at: number, days: number) {
  const d = new Date(at);
  d.setDate(d.getDate() + days);
  return d;
}
const ymd = (d: Date) => d.toISOString().slice(0, 10);
const md = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;

function domainOf(link: string) {
  try {
    return new URL(link).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export default function RequestsClient() {
  const s = useP2P();
  const [f, setF] = useState(EMPTY);
  const [step, setStep] = useState(1);
  const [filter, setFilter] = useState<'open' | 'all'>('open');
  const [done, setDone] = useState<string | null>(null);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  const at = s.ready ? demoNow(s) : Date.now();
  const unitUSD = Math.max(0, Number(f.unit) || 0);
  const guard = evaluate({ to: f.to, items: [{ name: f.title, category: f.category, unitUSD, qty: f.qty }] });
  const needsDuty = guard.zone !== 'block' && guard.excessUSD > 0;
  const duty = needsDuty ? guard.estDutyUSD : 0;
  const baseReward = rewardFor(unitUSD * f.qty);
  const b = breakdown({ unitUSD, qty: f.qty, dutyUSD: duty, rewardUSD: baseReward + f.extra });
  const deadline = addDays(at, f.waitDays);
  const step1Ok = Boolean(f.title.trim()) && unitUSD > 0 && f.qty >= 1 && guard.zone !== 'block';
  const step2Ok = f.from !== f.to && Boolean(f.toCity.trim());
  const canSubmit = step1Ok && step2Ok && Boolean(f.buyer.trim()) && f.agree && (!needsDuty || f.acceptDuty);

  const travelers = s.trips.filter((t) => t.from === f.from && t.to === f.to && t.arriveDate <= ymd(deadline) && !tripBlocked(t, at));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    actions.addRequest({
      buyer: f.buyer.trim(),
      title: f.title.trim(),
      link: f.link.trim(),
      category: f.category,
      qty: f.qty,
      unitUSD,
      packaging: f.packaging,
      size: f.size,
      details: f.details.trim(),
      waitDays: f.waitDays,
      from: f.from,
      to: f.to,
      toCity: f.toCity.trim(),
      neededBy: ymd(deadline),
      note: f.note.trim(),
      dutyUSD: duty,
      rewardUSD: b.reward,
    });
    setDone(f.title.trim());
    setF({ ...EMPTY, buyer: f.buyer, from: f.from, to: f.to, toCity: f.toCity });
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const list = s.requests.filter((r) => (filter === 'open' ? r.status === 'open' : true));

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1>구매 요청</h1>
          <p>사고 싶은 물건을 올리면 그 나라에서 오는 여행자가 제안해요. 매칭되기 전에는 결제되지 않아요.</p>
        </div>
      </div>

      {done && <div className="notice notice-ok">“{done}” 요청을 올렸어요. 여행자가 수락하면 거래 현황에 나타나요.</div>}

      <form className="checkout" onSubmit={submit}>
        <ol className="checkout-steps" aria-label="요청 단계">
          {['물건', '배송', '주문 요약'].map((label, i) => (
            <li key={label} aria-current={step === i + 1 ? 'step' : undefined} className={step > i + 1 ? 'done' : ''}>
              <button type="button" onClick={() => setStep(i + 1)} disabled={(i === 1 && !step1Ok) || (i === 2 && !(step1Ok && step2Ok))}>
                <span>{i + 1}</span> {label}
              </button>
            </li>
          ))}
        </ol>

        {step === 1 && (
          <section className="card co-card">
            <h2>1. 어떤 물건인가요?</h2>
            <div className="field">
              <label htmlFor="rq-link">상품 링크</label>
              <input id="rq-link" className="input" type="url" value={f.link} onChange={(e) => set('link', e.target.value)} placeholder="https:// (매장·브랜드 상품 페이지)" />
            </div>
            <div className="field">
              <label htmlFor="rq-title">물품 이름</label>
              <input id="rq-title" className="input" value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="예: 라로슈포제 시카플라스트 밤 B5 100ml" />
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="rq-unit">현지 가격 (개당 USD)</label>
                <input id="rq-unit" className="input" inputMode="decimal" value={f.unit} onChange={(e) => set('unit', e.target.value)} placeholder="16.97" />
              </div>
              <div className="field">
                <span className="label">수량</span>
                <div className="qty-input">
                  <button type="button" onClick={() => set('qty', Math.max(1, f.qty - 1))} aria-label="수량 줄이기">−</button>
                  <span aria-live="polite">{f.qty}</span>
                  <button type="button" onClick={() => set('qty', Math.min(20, f.qty + 1))} aria-label="수량 늘리기">+</button>
                </div>
              </div>
              <div className="field">
                <label htmlFor="rq-cat">종류</label>
                <select id="rq-cat" className="select" value={f.category} onChange={(e) => set('category', e.target.value as Category)}>
                  {CATEGORY_LIST.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <span className="label">포장</span>
                <div className="pills">
                  <button type="button" className="pill" aria-pressed={f.packaging === 'nobox'} onClick={() => set('packaging', 'nobox')}>박스 없이</button>
                  <button type="button" className="pill" aria-pressed={f.packaging === 'box'} onClick={() => set('packaging', 'box')}>박스째</button>
                </div>
              </div>
              <div className="field span-2">
                <span className="label">크기</span>
                <div className="size-pick">
                  {(Object.keys(EXPRESS_SHIPPING) as ItemSize[]).map((k) => (
                    <button key={k} type="button" aria-pressed={f.size === k} onClick={() => set('size', k)}>
                      <b>{EXPRESS_SHIPPING[k].label}</b>
                      <span>{EXPRESS_SHIPPING[k].hint}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="field span-2">
                <label htmlFor="rq-details">옵션·상세 <span className="opt">선택</span></label>
                <input id="rq-details" className="input" value={f.details} onChange={(e) => set('details', e.target.value)} placeholder="색상, 사이즈, 용량 등" />
              </div>
            </div>
            <p className="small muted">박스 없이 받으면 부피가 줄어서 여행자가 더 쉽게 수락해요.</p>
            {guard.zone === 'block' && <GuardPanel result={guard} />}
            <button type="button" className="btn btn-primary btn-lg" disabled={!step1Ok} onClick={() => setStep(2)}>다음</button>
          </section>
        )}

        {step === 2 && (
          <section className="card co-card">
            <h2>2. 어디로, 언제까지 받을까요?</h2>
            <div className="field">
              <span className="label">배송 경로</span>
              <div className="route-box">
                <label className="route-field">
                  <span>구매 국가 (여기서 사 와요)</span>
                  <CountrySelect id="rq-from" value={f.from} onChange={(v) => set('from', v)} />
                </label>
                <label className="route-field">
                  <span>받을 국가</span>
                  <CountrySelect id="rq-to" value={f.to} onChange={(v) => set('to', v)} />
                </label>
                <div className="route-field">
                  <label htmlFor="rq-city">받을 도시</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <input id="rq-city" className="input" style={{ flex: 1, minWidth: 140 }} value={f.toCity} onChange={(e) => set('toCity', e.target.value)} placeholder="예: 서울" />
                    <LocateButton
                      onFound={(city, cc) => {
                        set('toCity', city);
                        if (cc) set('to', cc);
                      }}
                    />
                  </div>
                </div>
              </div>
              <p className="small muted">그 도시로 가는 TripCarry 여행자가 물건을 사서 전해 줘요.</p>
              {f.from === f.to && <div className="notice notice-warn small">구매 국가와 받을 국가가 같아요.</div>}
            </div>

            <div className="field">
              <span className="label">얼마나 기다릴 수 있나요?</span>
              <div className="wait-list" role="radiogroup" aria-label="기다릴 수 있는 기간">
                {WAITS.map((w) => (
                  <button key={w.days} type="button" role="radio" aria-checked={f.waitDays === w.days} onClick={() => set('waitDays', w.days)}>
                    <span>
                      <b>{w.label}</b>
                      <em className={w.rec ? 'rec' : ''}>{w.sub}</em>
                    </span>
                    <span className="by">~{md(addDays(at, w.days))}까지</span>
                  </button>
                ))}
              </div>
              <p className="small muted">오래 기다릴수록 더 많은 여행자의 제안을 받고 고를 수 있어요.</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-lg" onClick={() => setStep(1)}>이전</button>
              <button type="button" className="btn btn-primary btn-lg" style={{ flex: 1 }} disabled={!step2Ok} onClick={() => setStep(3)}>다음</button>
            </div>
          </section>
        )}

        {step === 3 && (
          <>
            <section className="card co-card">
              <h2>3. 주문 요약</h2>
              <div className="co-item">
                <div className="co-thumb" aria-hidden="true">{CATEGORIES[f.category].label.slice(0, 2)}</div>
                <strong>{f.title}</strong>
              </div>
              <dl className="co-rows">
                <div><dt>구매 국가</dt><dd>{COUNTRIES[f.from].flag} {COUNTRIES[f.from].name}</dd></div>
                <div><dt>받을 곳</dt><dd>{f.toCity}, {COUNTRIES[f.to].name}</dd></div>
                <div><dt>받는 기한</dt><dd>{deadline.getFullYear()}년 {deadline.getMonth() + 1}월 {deadline.getDate()}일</dd></div>
                <hr />
                <div><dt>수량</dt><dd>{f.qty}</dd></div>
                <div><dt>포장</dt><dd>{f.packaging === 'box' ? '박스째' : '박스 없이'}</dd></div>
                <div><dt>크기</dt><dd>{EXPRESS_SHIPPING[f.size].label}</dd></div>
                {domainOf(f.link) && <div><dt>구매처</dt><dd><a href={f.link} target="_blank" rel="noreferrer noopener">{domainOf(f.link)}</a></dd></div>}
                {f.details && <div className="col"><dt>옵션·상세</dt><dd>{f.details}</dd></div>}
              </dl>
            </section>

            <section className="card co-travelers">
              {travelers.length > 0 && (
                <div className="avatars" aria-hidden="true">
                  {travelers.slice(0, 5).map((t) => (
                    <span key={t.id}>{t.traveler.slice(0, 1)}</span>
                  ))}
                </div>
              )}
              {travelers.length > 0 ? (
                <p><b className="reward">인증된 여행자 {travelers.length}명</b>이 {f.toCity}로 전해 줄 수 있어요 <span className="tiny muted">(미리보기 샘플)</span></p>
              ) : (
                <p className="small">아직 이 경로 여행자가 없어요. 요청을 올려 두면 경로가 맞는 여행자가 보고 제안해요.</p>
              )}
            </section>

            <RewardPicker
              base={baseReward}
              extra={f.extra}
              onExtra={(v) => set('extra', v)}
              resale={f.resale}
              onResale={(v) => set('resale', v)}
              itemUSD={b.item}
              qty={f.qty}
              total={b.buyerPays}
            />

            <section className="card co-card">
              <dl className="co-price">
                <div><dt>물품 가격 <Tip text={`현지 매장 가격 × ${f.qty}개`} /></dt><dd>{usd(b.item)}</dd></div>
                <div><dt>여행자 보상금 <Tip text={`기본은 물품 가격의 ${FEES.rewardRate * 100}%, 최소 $${FEES.rewardMin}. 올리면 더 빨리 수락돼요`} /></dt><dd>{usd(b.reward)}{f.extra > 0 && <small> (+{usd(f.extra)})</small>}</dd></div>
                {duty > 0 && <div><dt>예상 세금 <Tip text="면세 한도를 넘는 금액의 예상 관세·부가세. 여행자가 입국 때 신고하고 내요" /></dt><dd>{usd(duty)}</dd></div>}
                <div><dt>TripCarry 수수료 <Tip text={`구매자에게는 받지 않아요. 여행자 수고비의 ${FEES.travelerRate * 100}%를 여행자 정산에서 떼요`} /></dt><dd>$0.00</dd></div>
                <div><dt>결제 수수료 <Tip text={`카드사·결제대행사에 내는 수수료 (${(FEES.paymentRate * 100).toFixed(1)}% + $${FEES.paymentFixed.toFixed(2)})`} /></dt><dd>{usd(b.paymentFee)}</dd></div>
                <div className="total"><dt>예상 총액 <Tip text="여행자가 수락한 뒤에 결제돼요. 그 전에는 청구되지 않아요" /></dt><dd>{usd(b.buyerPays)} <small>≈ {fmtKRW(b.buyerPays)}</small></dd></div>
              </dl>
              <Anchor itemUSD={b.item} total={b.buyerPays} size={f.size} to={f.to} dutyRate={COUNTRIES[f.to].dutyRate} />
              <Bundle unitUSD={unitUSD} qty={f.qty} onPick={(q) => set('qty', q)} />
            </section>

            <section className="card co-card">
              {guard.zone !== 'safe' && <GuardPanel result={guard} />}
              {needsDuty && (
                <label className="check duty-accept">
                  <input type="checkbox" checked={f.acceptDuty} onChange={(e) => set('acceptDuty', e.target.checked)} />
                  <span className="small">면세 한도를 넘어요. 예상 세금 <b>{usd(duty)}</b>를 제가 부담하는 데 동의해요.</span>
                </label>
              )}
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="rq-buyer">내 이름(닉네임)</label>
                  <input id="rq-buyer" className="input" value={f.buyer} onChange={(e) => set('buyer', e.target.value)} placeholder="예: 제이슨" />
                </div>
                <div className="field">
                  <label htmlFor="rq-note">여행자에게 한마디 <span className="opt">선택</span></label>
                  <input id="rq-note" className="input" value={f.note} onChange={(e) => set('note', e.target.value)} />
                </div>
              </div>
              <label className="check">
                <input type="checkbox" checked={f.agree} onChange={(e) => set('agree', e.target.checked)} />
                <span className="small">
                  정품·합법 물품이며, <Link href="/rules" target="_blank">구매 전 확인 사항</Link>과 <Link href="/terms" target="_blank">이용약관</Link>에 동의해요.
                </span>
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-lg" onClick={() => setStep(2)}>이전</button>
                <button className="btn btn-primary btn-lg" style={{ flex: 1 }} type="submit" disabled={!canSubmit}>
                  {needsDuty && !f.acceptDuty ? '예상 세금에 동의해야 해요' : '여행자 제안 받기'}
                </button>
              </div>
              <p className="tiny muted" style={{ textAlign: 'center' }}>지금은 결제되지 않아요. 여행자가 수락하면 그때 결제해요.</p>
            </section>
          </>
        )}
      </form>

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
          <div className="card empty">아직 요청이 없어요.</div>
        ) : (
          <div className="grid-2" style={{ alignItems: 'start' }}>
            {list.map((r) => {
              const rb = breakdown(r);
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
                    <span>물품 <b>{usd(rb.item)}</b>{r.qty > 1 && ` (${usd(r.unitUSD)} × ${r.qty})`}</span>
                    <span>보상금 <b className="reward">{usd(rb.reward)}</b></span>
                    <span>요청자 <b>{r.buyer}</b></span>
                    {r.neededBy && <span><b>{r.neededBy}</b>까지</span>}
                  </div>
                  {r.note && <p className="small muted">“{r.note}”</p>}
                  {r.status !== 'open' && <Link className="small" href="/orders">거래 현황에서 보기 →</Link>}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

/** 보상금 올리기: 인기 물건은 공급자가 리셀로 팔 수도 있어서, 수고비를 더 걸면 매칭이 빨라진다 */
function RewardPicker({
  base,
  extra,
  onExtra,
  resale,
  onResale,
  itemUSD,
  qty,
  total,
}: {
  base: number;
  extra: number;
  onExtra: (v: number) => void;
  resale: string;
  onResale: (v: string) => void;
  itemUSD: number;
  qty: number;
  total: number;
}) {
  const resaleTotal = Math.max(0, Number(resale) || 0) * qty;
  const hasResale = resaleTotal > itemUSD;
  const suggested = hasResale ? suggestReward(itemUSD, resaleTotal) : 0;
  const reward = base + extra;
  const options = [0, 5, 10, 20];
  if (hasResale && suggested > base && !options.includes(suggested - base)) options.push(suggested - base);
  options.sort((a, b) => a - b);

  return (
    <section className="card co-card">
      <div>
        <h2>보상금(수고비)</h2>
        <p className="small muted">기본은 물품 가격의 {FEES.rewardRate * 100}%, 최소 ${FEES.rewardMin}예요. 인기 물건은 여행자가 리셀로 팔 수도 있어서, 수고비를 올리면 더 빨리 수락돼요.</p>
      </div>
      <div className="pills" role="group" aria-label="보상금">
        {options.map((o) => (
          <button key={o} type="button" className="pill" aria-pressed={extra === o} onClick={() => onExtra(o)}>
            {o === 0 ? `기본 ${usd(base)}` : `+${usd(o)}`}
            {hasResale && o === suggested - base && o > 0 ? ' · 추천' : ''}
          </button>
        ))}
      </div>
      <div className="field">
        <label htmlFor="rq-resale">리셀 시세 (1개, USD) <span className="opt">선택 · 알면 추천 보상금을 알려 드려요</span></label>
        <input id="rq-resale" className="input" inputMode="decimal" value={resale} onChange={(e) => onResale(e.target.value)} placeholder="예: 리셀 앱에서 본 가격" />
      </div>
      {hasResale && (
        <div className={`notice ${total < resaleTotal ? 'notice-ok' : 'notice-warn'} small`}>
          {total < resaleTotal ? (
            <>
              리셀로 사면 <b>{usd(resaleTotal)}</b> → TripCarry <b>{usd(total)}</b>, <b>{usd(resaleTotal - total)}</b> 아껴요.
              {reward < suggested ? (
                <> 리셀 웃돈이 커서 여행자가 리셀을 택할 수 있어요. 수고비를 <b>{usd(suggested)}</b>(웃돈의 {RESALE_SHARE * 100}%)로 올리면 매칭이 빨라져요.</>
              ) : (
                <> 수고비가 충분해서 매칭이 빠를 거예요.</>
              )}
            </>
          ) : (
            <>이 보상금이면 리셀로 사는 게 더 싸요({usd(resaleTotal)}). 수고비를 낮추거나 리셀로 사는 걸 추천해요.</>
          )}
        </div>
      )}
    </section>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <span className="tip" tabIndex={0} role="img" aria-label={text} data-tip={text}>
      ?
    </span>
  );
}

/** 정식 국제 특송으로 받을 때 예상 비용과 비교 (앵커 가격) */
function Anchor({ itemUSD, total, size, to, dutyRate }: { itemUSD: number; total: number; size: ItemSize; to: CountryCode; dutyRate: number }) {
  if (itemUSD <= 0) return null;
  const a = anchorPrice({ itemUSD, size, to, dutyRate });
  if (a.total <= total) {
    return <p className="anchor neutral small">이 물건은 해외 직구 배송이 더 쌀 수도 있어요. 정식 특송 예상가 약 {usd(a.total)}와 비교해 보세요.</p>;
  }
  return (
    <div className="anchor">
      <div className="anchor-row">
        <span className="small">DHL·FedEx 정식 국제 배송으로 받으면</span>
        <s>약 {usd(a.total)}</s>
      </div>
      <strong>약 {usd(a.total - total)} 아껴요</strong>
      <span className="tiny muted">예상: 물품 {usd(itemUSD)} + 특송비 약 {usd(a.shipping)}{a.duty > 0 ? ` + 관세·부가세 약 ${usd(a.duty)}` : ''} · 실제 요금은 무게·지역마다 달라요</span>
    </div>
  );
}

/** 싼 물건은 여러 개를 함께 부탁하면 개당 비용이 크게 줄어든다 (보상금 최소 $10이라서) */
function Bundle({ unitUSD, qty, onPick }: { unitUSD: number; qty: number; onPick: (q: number) => void }) {
  // 물품 합계가 보상금 최소 기준(=$100)을 넘으면 묶음 이득이 없다
  if (unitUSD <= 0 || unitUSD >= FEES.rewardMin / FEES.rewardRate || qty > 3) return null;
  const per = (q: number) => breakdown({ unitUSD, qty: q, dutyUSD: 0 }).buyerPays / q;
  const now = per(qty);
  return (
    <div className="bundle">
      <div className="small"><b>💡 함께 요청하면 개당 비용이 줄어요</b> — 보상금은 최소 ${FEES.rewardMin}라서, 여러 개를 한 번에 부탁할수록 이득이에요.</div>
      <div className="bundle-opts">
        {[1, 2, 3].map((q) => (
          <button key={q} type="button" aria-pressed={q === qty} onClick={() => onPick(q)}>
            <b>{q}개</b>
            <span>개당 {usd(per(q))}</span>
            {q > qty && now - per(q) > 0.01 && <em>개당 {usd(now - per(q))} ↓</em>}
          </button>
        ))}
      </div>
    </div>
  );
}

/** 현재 위치로 받을 도시 찾기 — 버튼을 눌렀을 때만 위치를 묻고, 좌표는 저장하지 않는다 */
function LocateButton({ onFound }: { onFound: (city: string, country: CountryCode | null) => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const locate = () => {
    if (!('geolocation' in navigator)) {
      setMsg('이 브라우저는 위치 찾기를 지원하지 않아요. 직접 입력해 주세요.');
      return;
    }
    setBusy(true);
    setMsg('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          // 도시 단위만 필요해서 좌표를 소수 둘째 자리(약 1km)로 줄여 보낸다
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&accept-language=ko&lat=${latitude.toFixed(2)}&lon=${longitude.toFixed(2)}`,
          );
          const data = await res.json();
          const a = data.address ?? {};
          const city = a.city || a.town || a.village || a.county || a.state || '';
          const cc = String(a.country_code || '').toUpperCase();
          if (!city) throw new Error('no city');
          const known = cc in COUNTRIES;
          onFound(city, known ? (cc as CountryCode) : null);
          setMsg(known ? '' : '이 나라는 아직 지원 노선이 아니에요. 받을 국가를 직접 골라 주세요.');
        } catch {
          setMsg('도시를 찾지 못했어요. 직접 입력해 주세요.');
        } finally {
          setBusy(false);
        }
      },
      (err) => {
        setBusy(false);
        setMsg(err.code === err.PERMISSION_DENIED ? '위치 권한이 꺼져 있어요. 브라우저에서 허용하거나 직접 입력해 주세요.' : '위치를 가져오지 못했어요. 직접 입력해 주세요.');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    );
  };
  return (
    <>
      <button type="button" className="btn" onClick={locate} disabled={busy} title="위치는 도시 이름을 찾는 데만 쓰고 저장하지 않아요">
        {busy ? '찾는 중…' : '📍 현재 위치'}
      </button>
      {msg && <span className="tiny" style={{ color: 'var(--warn)', flexBasis: '100%' }}>{msg}</span>}
    </>
  );
}
