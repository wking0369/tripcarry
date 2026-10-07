'use client';

import Link from 'next/link';
import { useState } from 'react';
import { fmtKRW } from '@/lib/customs';
import { RULES } from '@/lib/rules';
import { FLOW, STATUS_LABEL, actions, breakdown, demoNow, useP2P, type Req, type Trip } from '@/lib/store';
import { BeforeYouBuy, Icon } from '../RulesVisual';
import { Loading, Route, StatusChip, usd } from '../ui';

const ACTIVE = new Set(['matched', 'escrow', 'purchased', 'delivered']);

function left(due: string | undefined, at: number) {
  if (!due) return '';
  const ms = new Date(due).getTime() - at;
  if (ms <= 0) return '기한 지남';
  const h = Math.floor(ms / 3600_000);
  const m = Math.floor((ms % 3600_000) / 60_000);
  return h > 0 ? `${h}시간 ${m}분 남음` : `${m}분 남음`;
}

export default function OrdersClient() {
  const s = useP2P();
  const at = demoNow(s);
  const orders = s.requests.filter((r) => r.status !== 'open');
  const active = orders.filter((r) => ACTIVE.has(r.status));
  const closed = orders.filter((r) => !ACTIVE.has(r.status));
  const settled = orders.filter((r) => r.status === 'settled');
  const escrowHeld = s.requests
    .filter((r) => r.status === 'escrow' || r.status === 'purchased' || r.status === 'delivered')
    .reduce((sum, r) => sum + breakdown(r).buyerPays, 0);
  const revenue = settled.reduce((sum, r) => sum + breakdown(r).platform, 0);

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1>거래 현황</h1>
          <p>미리보기라서 구매자·여행자 역할을 한 화면에서 모두 눌러 볼 수 있어요. 기한이 지나면 운영자 없이 자동으로 처리돼요.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-sm" onClick={() => actions.advance(24)} title="자동 취소·환불·정산 규칙을 확인해 보세요">
            ⏩ 24시간 빨리 감기
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              if (confirm('샘플 데이터로 되돌릴까요? 직접 올린 요청과 일정은 지워져요.')) actions.reset();
            }}
          >
            데모 초기화
          </button>
        </div>
      </div>
      {s.offsetMs > 0 && (
        <div className="notice notice-info small">
          미리보기 시각: {new Date(at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })} (실제보다 {Math.round(s.offsetMs / 3600_000)}시간 뒤)
        </div>
      )}

      <div className="grid-4">
        <div className="card"><div className="stat-num">{active.length}</div><div className="stat-label">진행 중 거래</div></div>
        <div className="card"><div className="stat-num">{usd(escrowHeld)}</div><div className="stat-label">에스크로 보관 중</div></div>
        <div className="card"><div className="stat-num">{settled.length}</div><div className="stat-label">정산 완료</div></div>
        <div className="card"><div className="stat-num">{usd(revenue)}</div><div className="stat-label">플랫폼 수수료 수익</div></div>
      </div>

      {!s.ready ? (
        <Loading />
      ) : (
        <>
          <section className="section">
            <div className="section-head"><h2>진행 중</h2></div>
            {active.length === 0 ? (
              <div className="card empty">
                진행 중인 거래가 없어요. <Link href="/trips">여행 일정</Link>에서 요청을 수락해 보세요.
              </div>
            ) : (
              <div className="grid-2" style={{ alignItems: 'start' }}>
                {active.map((r) => (
                  <Order key={r.id} r={r} trip={s.trips.find((t) => t.id === r.tripId)} at={at} />
                ))}
              </div>
            )}
          </section>

          {closed.length > 0 && (
            <section className="section">
              <div className="section-head"><h2>완료 · 취소</h2></div>
              <div className="grid-2" style={{ alignItems: 'start' }}>
                {closed.map((r) => (
                  <Order key={r.id} r={r} trip={s.trips.find((t) => t.id === r.tripId)} at={at} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}

function FileStep({ label, onDone, button }: { label: string; button: string; onDone: (name: string) => void }) {
  const [file, setFile] = useState('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input className="file-input" type="file" accept="image/*" capture="environment" aria-label={label} onChange={(e) => setFile(e.target.files?.[0]?.name ?? '')} />
      <button type="button" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={!file} onClick={() => onDone(file)}>
        {button}
      </button>
    </div>
  );
}

function Order({ r, trip, at }: { r: Req; trip?: Trip; at: number }) {
  const b = breakdown(r);
  const idx = FLOW.indexOf(r.status);
  const traveler = trip?.traveler ?? '여행자';
  const [agree, setAgree] = useState(false);
  const [code, setCode] = useState('');
  const [codeErr, setCodeErr] = useState(false);
  const live = ACTIVE.has(r.status);

  return (
    <article className="card req-card">
      <div className="req-head">
        <div className="grow">
          <div className="req-title">{r.title}</div>
          <div style={{ marginTop: 6 }}>
            <Route from={r.from} to={r.to} fromCity={trip?.fromCity} toCity={r.toCity} />
          </div>
          <div className="kv" style={{ marginTop: 4 }}>
            <span>구매자 <b>{r.buyer}</b></span>
            <span>여행자 <b>{traveler}</b>{trip?.verified && ' ✓'}{trip && trip.reviews > 0 && ` · ★ ${trip.rating.toFixed(1)}`}</span>
          </div>
        </div>
        <StatusChip status={r.status} />
      </div>

      {r.status !== 'cancelled' && (
        <div className="stepper" aria-label={`진행 단계: ${STATUS_LABEL[r.status]}`}>
          {FLOW.map((st, i) => (
            <div key={st}>
              <div className={`step-bar${i <= idx ? ' on' : ''}`} />
              <div className={`step-label${i === idx ? ' on' : ''}`}>{STATUS_LABEL[st]}</div>
            </div>
          ))}
        </div>
      )}

      {(r.proofs.purchase || r.proofs.pack || r.proofs.handover) && (
        <ul className="proof-list">
          {r.proofs.purchase && <li><Icon name="camera" /> ① 구매 인증 <span>{r.proofs.purchase}</span></li>}
          {r.proofs.pack && <li><Icon name="box" /> ② 포장 인증 <span>{r.proofs.pack}</span></li>}
          {r.proofs.handover && <li><Icon name="qr" /> ③ 수령 인증 <span>{r.proofs.handover}</span></li>}
        </ul>
      )}

      <details>
        <summary className="small muted" style={{ cursor: 'pointer' }}>금액 자세히 · 구매자 결제 {usd(b.buyerPays)}</summary>
        <div className="breakdown" style={{ marginTop: 8 }}>
          <div><span>물품 {r.qty > 1 ? `(${usd(r.unitUSD)} × ${r.qty})` : ''}</span><span>{usd(b.item)}</span></div>
          <div><span>여행자 보상금</span><span>{usd(b.reward)}</span></div>
          {r.dutyUSD > 0 && <div><span>예상 세금 (구매자 부담 · 선결제)</span><span>{usd(r.dutyUSD)}</span></div>}
          <div><span>결제 수수료 (카드사·PG)</span><span>{usd(b.paymentFee)}</span></div>
          <div className="total"><span>구매자 결제액</span><span>{usd(b.buyerPays)} <span className="muted small">≈ {fmtKRW(b.buyerPays)}</span></span></div>
          <div className="muted-row"><span>여행자 정산액 (수고비의 20% {usd(b.travelerFee)} = TripCarry 몫 차감)</span><span>{usd(b.travelerGets)}</span></div>
          <div className="muted-row"><span>TripCarry 수익 (결제 수수료 제외)</span><span>{usd(b.platform)}</span></div>
        </div>
      </details>

      {r.status === 'matched' && (
        <div className="action-box">
          <div className="small"><span className="who who-buyer">구매자</span> {traveler} 님이 수락했어요. 결제 전에 아래 규칙을 확인해 주세요.</div>
          <BeforeYouBuy lang="ko" compact />
          <label className="check">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span className="small">구매 전 확인 사항과 이용약관에 동의해요.</span>
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-primary" disabled={!agree} onClick={() => actions.pay(r.id)}>에스크로 결제 {usd(b.buyerPays)}</button>
            <button type="button" className="btn btn-ghost" onClick={() => actions.release(r.id)}>매칭 해제</button>
          </div>
        </div>
      )}

      {r.status === 'escrow' && (
        <div className="action-box">
          <div className="deadline"><Icon name="refund" tone="warn" /> 구매 인증 기한 <b>{left(r.receiptDue, at)}</b> — 넘기면 자동 취소·전액 환불</div>
          <div className="small"><span className="who who-traveler">여행자</span> ① 매장에서 <b>물품과 영수증을 한 장에</b> 찍어 올려 주세요. 올리기 전에는 다음 단계로 갈 수 없어요.</div>
          <FileStep label="물품+영수증 사진" button="구매 인증 올리기" onDone={(f) => actions.proofPurchase(r.id, f)} />
          <button type="button" className="btn btn-danger" style={{ alignSelf: 'flex-start' }} onClick={() => actions.cancel(r.id)}>구매자 취소 (전액 자동 환불)</button>
        </div>
      )}

      {r.status === 'purchased' && (
        <div className="action-box">
          {!r.proofs.pack ? (
            <>
              <div className="small"><span className="who who-traveler">여행자</span> ② 전달 직전에 <b>물품 상태</b>를 찍어 올려 주세요.</div>
              <FileStep label="포장 상태 사진" button="포장 인증 올리기" onDone={(f) => actions.proofPack(r.id, f)} />
            </>
          ) : (
            <>
              <div className="small"><span className="who who-buyer">구매자</span> 현장에서 여행자에게 이 코드를 보여 주세요.</div>
              <div className="handover-code" aria-label="수령 코드">{r.code}</div>
              <div className="small"><span className="who who-traveler">여행자</span> ③ 구매자의 코드를 입력하면 <b>즉시 거래 완료</b>돼요.</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" inputMode="numeric" maxLength={6} placeholder="6자리 코드" value={code} onChange={(e) => { setCode(e.target.value); setCodeErr(false); }} style={{ maxWidth: 160 }} />
                <button type="button" className="btn btn-primary" onClick={() => setCodeErr(!actions.handoverCode(r.id, code))}>확인</button>
              </div>
              {codeErr && <div className="notice notice-warn small">코드가 맞지 않아요.</div>}
              <div className="small muted">코드를 못 받으면 현장 수령 사진으로 대신해요. ({RULES.confirmDueHours}시간 안에 구매자가 확인하지 않으면 자동 수령 처리)</div>
              <FileStep label="현장 수령 사진" button="수령 사진 올리기" onDone={(f) => actions.handoverPhoto(r.id, f)} />
            </>
          )}
        </div>
      )}

      {r.status === 'delivered' && (
        <div className="action-box">
          <div className="deadline"><Icon name="check" /> 자동 수령 처리까지 <b>{left(r.confirmDue, at)}</b></div>
          <div className="small"><span className="who who-buyer">구매자</span> 물건 상태를 확인했으면 눌러 주세요. 여행자에게 {usd(b.travelerGets)}가 정산돼요.</div>
          <button type="button" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => actions.confirm(r.id)}>수령 확인 · 정산하기</button>
        </div>
      )}

      {(live || r.chat.length > 0) && <Chat r={r} traveler={traveler} live={live} />}

      <details>
        <summary className="small muted" style={{ cursor: 'pointer' }}>기록 {r.history.length}건</summary>
        <ul className="timeline" style={{ marginTop: 8 }}>
          {r.history.map((h, i) => (
            <li key={i}>
              <span>{new Date(h.at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              <span style={{ color: h.text.startsWith('[자동]') ? 'var(--warn)' : 'var(--ink-2)' }}>{h.text}</span>
            </li>
          ))}
        </ul>
      </details>
    </article>
  );
}

const QUICK = ['도착했어요', '전달 장소를 바꿀 수 있을까요?', '30분 늦어요', '잘 받았어요, 감사합니다!'];

function Chat({ r, traveler, live }: { r: Req; traveler: string; live: boolean }) {
  const [as, setAs] = useState<'buyer' | 'traveler'>('buyer');
  const [text, setText] = useState('');
  const send = (t: string) => {
    actions.send(r.id, as, t);
    setText('');
  };
  const title = `💬 1:1 채팅 (${r.chat.filter((m) => m.from !== 'system').length})`;
  if (!live) {
    return (
      <details className="chat">
        <summary className="small" style={{ cursor: 'pointer', fontWeight: 600 }}>{title}</summary>
        <ChatLog r={r} traveler={traveler} />
      </details>
    );
  }
  return (
    <div className="chat">
      <div className="small" style={{ fontWeight: 600 }}>{title} <span className="muted" style={{ fontWeight: 400 }}>· 장소·시간은 상대방과 직접 정해요</span></div>
      <ChatLog r={r} traveler={traveler} />
      <>
          <div className="pills" style={{ marginTop: 8 }}>
            <button type="button" className="pill btn-sm" aria-pressed={as === 'buyer'} onClick={() => setAs('buyer')}>구매자로 보내기</button>
            <button type="button" className="pill btn-sm" aria-pressed={as === 'traveler'} onClick={() => setAs('traveler')}>여행자로 보내기</button>
          </div>
          <div className="lp-chips" style={{ marginTop: 8 }}>
            {QUICK.map((q) => (
              <button key={q} type="button" className="chip chip-neutral chip-btn" onClick={() => send(q)}>{q}</button>
            ))}
          </div>
          <form
            style={{ display: 'flex', gap: 8, marginTop: 8 }}
            onSubmit={(e) => {
              e.preventDefault();
              send(text);
            }}
          >
            <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="메시지 입력" aria-label="메시지" />
            <button className="btn btn-dark" type="submit" disabled={!text.trim()}>보내기</button>
          </form>
      </>
    </div>
  );
}

function ChatLog({ r, traveler }: { r: Req; traveler: string }) {
  return (
    <div className="chat-log">
      {r.chat.map((m, i) => (
        <div key={i} className={`chat-msg ${m.from}`}>
          {m.from !== 'system' && <span className="chat-who">{m.from === 'buyer' ? r.buyer : traveler}</span>}
          <span className="chat-text">{m.text}</span>
        </div>
      ))}
    </div>
  );
}
