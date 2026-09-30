'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CATEGORIES, COUNTRIES, allowanceUSD, evaluate, fmtKRW, type CountryCode } from '@/lib/customs';
import { actions, breakdown, fitsTrip, tripLoadUSD, useP2P, type Trip } from '@/lib/store';
import { CountrySelect, GuardPanel, Loading, Route, usd } from '../ui';

const EMPTY_FORM = {
  traveler: '',
  from: 'US' as CountryCode,
  fromCity: '',
  to: 'KR' as CountryCode,
  toCity: '',
  departDate: '',
  arriveDate: '',
  spaceKg: '5',
  resident: true,
  verified: false,
  note: '',
};

export default function TripsClient() {
  const s = useP2P();
  const [picked, setPicked] = useState<string | null>(null);
  const [f, setF] = useState(EMPTY_FORM);
  const [flash, setFlash] = useState<string | null>(null);

  const trip = s.trips.find((t) => t.id === picked) ?? s.trips[0];
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const canSubmit = f.traveler.trim() && f.departDate && f.arriveDate && f.from !== f.to && f.arriveDate >= f.departDate;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const id = actions.addTrip({
      traveler: f.traveler.trim(),
      from: f.from,
      fromCity: f.fromCity.trim(),
      to: f.to,
      toCity: f.toCity.trim(),
      departDate: f.departDate,
      arriveDate: f.arriveDate,
      spaceKg: Math.max(1, Number(f.spaceKg) || 1),
      resident: f.resident,
      verified: f.verified,
      note: f.note.trim(),
    });
    setPicked(id);
    setFlash('여행 일정을 올렸어요. 경로가 맞는 요청을 아래에서 확인하세요.');
    setF({ ...EMPTY_FORM, traveler: f.traveler });
  };

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1>여행 일정</h1>
          <p>이동 경로를 올리면 가는 길에 사다 줄 수 있는 요청을 골라 드려요. 면세 한도는 이번 여행에 실은 물품을 모두 합쳐 계산해요.</p>
        </div>
      </div>

      <div className="split">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <section className="section">
            <div className="section-head">
              <h2>등록된 여행</h2>
              <span>눌러서 매칭 요청 보기</span>
            </div>
            {!s.ready ? (
              <Loading />
            ) : s.trips.length === 0 ? (
              <div className="card empty">등록된 여행이 없어요.</div>
            ) : (
              <div className="trip-pick">
                {s.trips.map((t) => (
                  <TripOption key={t.id} trip={t} active={trip?.id === t.id} onPick={() => { setPicked(t.id); setFlash(null); }} load={tripLoadUSD(s, t.id)} />
                ))}
              </div>
            )}
          </section>

          {trip && <Matches key={trip.id} trip={trip} flash={flash} />}
        </div>

        <form className="card sticky" onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600 }}>새 여행 일정</h2>
          <div className="field">
            <label htmlFor="tp-name">내 이름(닉네임)</label>
            <input id="tp-name" className="input" value={f.traveler} onChange={(e) => set('traveler', e.target.value)} placeholder="예: 민서" />
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="tp-from">출발 국가</label>
              <CountrySelect id="tp-from" value={f.from} onChange={(v) => set('from', v)} />
            </div>
            <div className="field">
              <label htmlFor="tp-fromcity">출발 도시</label>
              <input id="tp-fromcity" className="input" value={f.fromCity} onChange={(e) => set('fromCity', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="tp-to">도착 국가</label>
              <CountrySelect id="tp-to" value={f.to} onChange={(v) => set('to', v)} />
            </div>
            <div className="field">
              <label htmlFor="tp-tocity">도착 도시</label>
              <input id="tp-tocity" className="input" value={f.toCity} onChange={(e) => set('toCity', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="tp-dep">출발일</label>
              <input id="tp-dep" className="input" type="date" value={f.departDate} onChange={(e) => set('departDate', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="tp-arr">도착일</label>
              <input id="tp-arr" className="input" type="date" value={f.arriveDate} onChange={(e) => set('arriveDate', e.target.value)} />
            </div>
            <div className="field span-2">
              <label htmlFor="tp-kg">남는 수하물 공간 (kg)</label>
              <input id="tp-kg" className="input" inputMode="numeric" value={f.spaceKg} onChange={(e) => set('spaceKg', e.target.value)} />
            </div>
            <div className="field span-2">
              <span className="label">{COUNTRIES[f.to].name} 거주자인가요?</span>
              <div className="pills">
                <button type="button" className="pill" aria-pressed={f.resident} onClick={() => set('resident', true)}>거주자</button>
                <button type="button" className="pill" aria-pressed={!f.resident} onClick={() => set('resident', false)}>방문객</button>
              </div>
              <span className="tiny muted">면세 한도: {usd(allowanceUSD(f.to, f.resident))} ({COUNTRIES[f.to].allowanceNote})</span>
            </div>
            <div className="field span-2">
              <label htmlFor="tp-note">구매자에게 한마디</label>
              <textarea id="tp-note" className="textarea" rows={2} value={f.note} onChange={(e) => set('note', e.target.value)} placeholder="들를 지역, 전달 가능한 장소 등" />
            </div>
          </div>
          <label className="check">
            <input type="checkbox" checked={f.verified} onChange={(e) => set('verified', e.target.checked)} />
            <span className="small">여권·휴대폰 본인 인증 완료 (데모에서는 체크만 하면 인증 배지가 붙어요)</span>
          </label>
          {f.from === f.to && <div className="notice notice-warn">출발 국가와 도착 국가가 같아요.</div>}
          {f.departDate && f.arriveDate && f.arriveDate < f.departDate && <div className="notice notice-warn">도착일이 출발일보다 빨라요.</div>}
          <button className="btn btn-primary" type="submit" disabled={!canSubmit}>여행 일정 올리기</button>
        </form>
      </div>
    </main>
  );
}

function TripOption({ trip, active, onPick, load }: { trip: Trip; active: boolean; onPick: () => void; load: number }) {
  const allowance = allowanceUSD(trip.to, trip.resident);
  return (
    <button type="button" className="trip-option" aria-pressed={active} onClick={onPick}>
      <div className="grow">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <strong>{trip.traveler}</strong>
          {trip.verified ? <span className="chip chip-ok">인증</span> : <span className="chip chip-neutral">미인증</span>}
          <Route from={trip.from} to={trip.to} fromCity={trip.fromCity} toCity={trip.toCity} />
        </div>
        <div className="kv" style={{ marginTop: 4 }}>
          <span>{trip.departDate} 출발 · {trip.arriveDate} 도착</span>
          <span>공간 {trip.spaceKg}kg</span>
          <span>면세 사용 {usd(load)} / {usd(allowance)}</span>
        </div>
      </div>
    </button>
  );
}

function Matches({ trip, flash }: { trip: Trip; flash: string | null }) {
  const s = useP2P();
  const load = tripLoadUSD(s, trip.id);
  const open = s.requests.filter((r) => r.status === 'open' && fitsTrip(r, trip));
  const mine = s.requests.filter((r) => r.tripId === trip.id && r.status !== 'cancelled');
  const [accepted, setAccepted] = useState<string | null>(null);

  return (
    <section className="section">
      <div className="section-head">
        <h2>{trip.traveler} 님 경로에 맞는 요청</h2>
        <span>{open.length}건</span>
      </div>
      {flash && <div className="notice notice-ok">{flash}</div>}
      {accepted && (
        <div className="notice notice-ok">
          “{accepted}” 요청을 수락했어요. 구매자가 결제하면 <Link href="/orders">거래 현황</Link>에서 진행할 수 있어요.
        </div>
      )}
      {trip.note && <p className="small muted">“{trip.note}”</p>}
      {open.length === 0 ? (
        <div className="card empty">
          {COUNTRIES[trip.from].name} → {COUNTRIES[trip.to].name} 경로에서 도착일({trip.arriveDate}) 이후로 받을 수 있는 요청이 아직 없어요.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {open.map((r) => {
            const guard = evaluate({
              to: trip.to,
              resident: trip.resident,
              existingUSD: load,
              items: [{ name: r.title, category: r.category, unitUSD: r.unitUSD, qty: r.qty }],
            });
            const b = breakdown({ ...r, dutyUSD: guard.estDutyUSD });
            return (
              <article key={r.id} className="card req-card">
                <div className="req-head">
                  <div className="grow">
                    <div className="req-title">{r.title}</div>
                    <div className="kv" style={{ marginTop: 6 }}>
                      <span>{CATEGORIES[r.category].label}</span>
                      <span>물품 <b>{usd(b.item)}</b>{r.qty > 1 && ` (${usd(r.unitUSD)} × ${r.qty})`}</span>
                      <span>요청자 <b>{r.buyer}</b> · {r.toCity || COUNTRIES[r.to].name}</span>
                      {r.neededBy && <span>{r.neededBy}까지</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="money reward">{usd(r.rewardUSD - b.travelerFee)}</div>
                    <div className="tiny muted">수수료 뗀 내 수익 · 약 {fmtKRW(r.rewardUSD - b.travelerFee)}</div>
                  </div>
                </div>
                <GuardPanel result={guard} compact={guard.zone === 'safe'} />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={guard.zone === 'block'}
                    onClick={() => {
                      actions.accept(r.id, trip, guard.estDutyUSD);
                      setAccepted(r.title);
                    }}
                  >
                    {guard.excessUSD > 0 ? `관세 선결제 조건으로 수락 (+${usd(guard.estDutyUSD)})` : '수락하기'}
                  </button>
                  {r.link && (
                    <a className="btn btn-ghost" href={r.link} target="_blank" rel="noreferrer noopener">상품 보기</a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {mine.length > 0 && (
        <div className="card-flush" style={{ marginTop: 8 }}>
          <div className="row small muted" style={{ fontWeight: 600 }}>이번 여행에 맡은 물품</div>
          {mine.map((r) => (
            <div key={r.id} className="row">
              <div className="grow small">
                <b>{r.title}</b> <span className="muted">· {usd(r.unitUSD * r.qty)}</span>
              </div>
              <Link className="small" href="/orders">{r.status === 'settled' ? '정산 완료' : '진행하기'}</Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
