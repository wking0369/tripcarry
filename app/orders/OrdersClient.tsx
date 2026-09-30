'use client';

import Link from 'next/link';
import { useState } from 'react';
import { fmtKRW } from '@/lib/customs';
import { FLOW, STATUS_LABEL, actions, breakdown, useP2P, type Req, type Trip } from '@/lib/store';
import { Loading, Route, StatusChip, usd } from '../ui';

const ACTIVE = new Set(['matched', 'escrow', 'purchased', 'delivered']);

export default function OrdersClient() {
  const s = useP2P();
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
          <p>결제 → 보관 → 구매(영수증) → 전달(사진) → 수령 확인 → 정산. 데모라서 구매자·여행자 역할을 한 화면에서 모두 눌러 볼 수 있어요.</p>
        </div>
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

      <div className="grid-4">
        <div className="card"><div className="stat-num">{active.length}</div><div className="stat-label">진행 중 거래</div></div>
        <div className="card"><div className="stat-num">{usd(escrowHeld)}</div><div className="stat-label">플랫폼 보관 중인 대금</div></div>
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
                  <Order key={r.id} r={r} trip={s.trips.find((t) => t.id === r.tripId)} />
                ))}
              </div>
            )}
          </section>

          {closed.length > 0 && (
            <section className="section">
              <div className="section-head"><h2>완료 · 취소</h2></div>
              <div className="grid-2" style={{ alignItems: 'start' }}>
                {closed.map((r) => (
                  <Order key={r.id} r={r} trip={s.trips.find((t) => t.id === r.tripId)} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}

function Order({ r, trip }: { r: Req; trip?: Trip }) {
  const b = breakdown(r);
  const idx = FLOW.indexOf(r.status);
  const [file, setFile] = useState('');
  const traveler = trip?.traveler ?? '여행자';

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
            <span>여행자 <b>{traveler}</b>{trip?.verified && ' ✓'}</span>
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

      <div className="breakdown">
        <div><span>물품 {r.qty > 1 ? `(${usd(r.unitUSD)} × ${r.qty})` : ''}</span><span>{usd(b.item)}</span></div>
        <div><span>여행자 보상금</span><span>{usd(r.rewardUSD)}</span></div>
        <div><span>구매자 서비스 수수료</span><span>{usd(b.buyerFee)}</span></div>
        {r.dutyUSD > 0 && <div><span>관세 선결제 (여행자가 입국 때 납부)</span><span>{usd(r.dutyUSD)}</span></div>}
        <div className="total"><span>구매자 결제액</span><span>{usd(b.buyerPays)} <span className="muted small">≈ {fmtKRW(b.buyerPays)}</span></span></div>
        <div className="muted-row"><span>여행자 정산액 (보상금 수수료 {usd(b.travelerFee)} 차감)</span><span>{usd(b.travelerGets)}</span></div>
        <div className="muted-row"><span>플랫폼 수익</span><span>{usd(b.platform)}</span></div>
      </div>

      {r.status === 'matched' && (
        <div className="action-box">
          <div className="small"><span className="who who-buyer">구매자</span> {traveler} 님이 수락했어요. 결제하면 대금은 전달이 끝날 때까지 플랫폼이 보관해요.</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-primary" onClick={() => actions.pay(r.id)}>에스크로 결제 {usd(b.buyerPays)}</button>
            <button type="button" className="btn btn-ghost" onClick={() => actions.release(r.id)}>매칭 해제</button>
          </div>
        </div>
      )}

      {r.status === 'escrow' && (
        <div className="action-box">
          <div className="small"><span className="who who-traveler">여행자</span> 결제가 끝났어요. 현지 매장에서 직접 사고 영수증을 첨부해 주세요.</div>
          <input className="file-input" type="file" accept="image/*,.pdf" aria-label="영수증 파일" onChange={(e) => setFile(e.target.files?.[0]?.name ?? '')} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-primary" disabled={!file} onClick={() => { actions.purchased(r.id, file); setFile(''); }}>구매 완료</button>
            <button type="button" className="btn btn-danger" onClick={() => actions.cancel(r.id)}>취소 (전액 환불)</button>
          </div>
        </div>
      )}

      {r.status === 'purchased' && (
        <div className="action-box">
          <div className="small">
            <span className="who who-traveler">여행자</span> 영수증: {r.receipt}.{' '}
            {r.dutyUSD > 0 ? '입국할 때 세관에 자진 신고하고, ' : ''}전달하면서 현장 사진을 찍어 올려 주세요.
          </div>
          <input className="file-input" type="file" accept="image/*" aria-label="전달 현장 사진" onChange={(e) => setFile(e.target.files?.[0]?.name ?? '')} />
          <button type="button" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={!file} onClick={() => { actions.delivered(r.id, file); setFile(''); }}>전달 완료</button>
        </div>
      )}

      {r.status === 'delivered' && (
        <div className="action-box">
          <div className="small"><span className="who who-buyer">구매자</span> 물건 상태를 확인했으면 수령 확인을 눌러 주세요. 그때 여행자에게 {usd(b.travelerGets)}가 정산돼요.</div>
          <button type="button" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => actions.confirm(r.id)}>수령 확인 · 정산하기</button>
        </div>
      )}

      <details>
        <summary className="small muted" style={{ cursor: 'pointer' }}>기록 {r.history.length}건</summary>
        <ul className="timeline" style={{ marginTop: 8 }}>
          {r.history.map((h, i) => (
            <li key={i}>
              <span>{new Date(h.at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              <span style={{ color: 'var(--ink-2)' }}>{h.text}</span>
            </li>
          ))}
        </ul>
      </details>
    </article>
  );
}
