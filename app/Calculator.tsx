'use client';

import { useState } from 'react';
import { CATEGORY_LIST, COUNTRIES, evaluate, type Category, type CountryCode } from '@/lib/customs';
import { CountrySelect, GuardPanel } from './ui';

interface Row {
  key: number;
  name: string;
  category: Category;
  price: string;
  qty: string;
}

let nextKey = 3;

export default function Calculator() {
  const [to, setTo] = useState<CountryCode>('KR');
  const [resident, setResident] = useState(true);
  const [rows, setRows] = useState<Row[]>([
    { key: 1, name: '향수 50ml', category: 'cosmetics', price: '230', qty: '1' },
    { key: 2, name: '무선 이어폰', category: 'electronics', price: '249', qty: '1' },
  ]);

  const items = rows.map((r) => ({ name: r.name, category: r.category, unitUSD: Number(r.price) || 0, qty: Math.max(1, Number(r.qty) || 1) }));
  const result = evaluate({ to, resident, items });
  const country = COUNTRIES[to];

  const patch = (key: number, p: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...p } : r)));

  return (
    <div className="grid-2" style={{ alignItems: 'start' }}>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="calc-to">입국(도착) 국가</label>
            <CountrySelect id="calc-to" value={to} onChange={setTo} />
          </div>
          <div className="field">
            <span className="label">여행자 거주 여부</span>
            <div className="pills">
              <button type="button" className="pill" aria-pressed={resident} onClick={() => setResident(true)}>거주자</button>
              <button type="button" className="pill" aria-pressed={!resident} onClick={() => setResident(false)}>방문객</button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span className="label small" style={{ fontWeight: 600 }}>가방에 실을 물품</span>
          {rows.map((r, i) => (
            <div key={r.key} className="action-box" style={{ gap: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" aria-label={`물품 ${i + 1} 이름`} placeholder="물품 이름" value={r.name} onChange={(e) => patch(r.key, { name: e.target.value })} />
                <button type="button" className="btn btn-danger btn-sm" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))} aria-label={`물품 ${i + 1} 삭제`}>
                  삭제
                </button>
              </div>
              <div className="form-grid" style={{ gridTemplateColumns: '1.4fr 1fr 0.7fr', gap: 8 }}>
                <select className="select" aria-label={`물품 ${i + 1} 종류`} value={r.category} onChange={(e) => patch(r.key, { category: e.target.value as Category })}>
                  {CATEGORY_LIST.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
                <input className="input" inputMode="decimal" aria-label={`물품 ${i + 1} 단가(USD)`} placeholder="단가 $" value={r.price} onChange={(e) => patch(r.key, { price: e.target.value })} />
                <input className="input" inputMode="numeric" aria-label={`물품 ${i + 1} 수량`} placeholder="수량" value={r.qty} onChange={(e) => patch(r.key, { qty: e.target.value })} />
              </div>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-sm"
            style={{ alignSelf: 'flex-start' }}
            onClick={() => setRows((rs) => [...rs, { key: nextKey++, name: '', category: 'general', price: '', qty: '1' }])}
          >
            + 물품 추가
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <GuardPanel result={result} />
        <div className="card small">
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            {country.flag} {country.name} 입국 규정 요약
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--ink-2)' }}>
            <li>일반 면세 한도: {country.allowanceNote}</li>
            {country.extras.map((x) => (
              <li key={x}>{x}</li>
            ))}
            <li>한도 초과분 예상 세율(추정): 약 {Math.round(country.dutyRate * 100)}%</li>
          </ul>
          <p className="tiny muted" style={{ marginTop: 10 }}>
            금액은 USD 기준, 데모용 고정 환율로 계산해요. 실제 서비스에서는 관세 API로 규정과 환율을 매일 갱신해야 해요.
          </p>
        </div>
      </div>
    </div>
  );
}
