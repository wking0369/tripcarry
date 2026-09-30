'use client';

import { useState } from 'react';
import { CATEGORY_LIST, COUNTRIES, categoryText, countryText, evaluate, type Category, type CountryCode, type Lang } from '@/lib/customs';
import { CountrySelect, GuardPanel } from './ui';

interface Row {
  key: number;
  name: string;
  category: Category;
  price: string;
  qty: string;
}

let nextKey = 3;

const TEXT = {
  ko: {
    to: '입국(도착) 국가', residency: '여행자 거주 여부', resident: '거주자', visitor: '방문객', bag: '가방에 실을 물품',
    name: '물품 이름', type: '종류', price: '단가(USD)', qty: '수량', del: '삭제', add: '+ 물품 추가',
    summary: '입국 규정 요약', limit: '일반 면세 한도', rate: '한도 초과분 예상 세율(추정): 약',
    note: '금액은 USD 기준, 데모용 고정 환율로 계산해요. 실제 서비스에서는 관세 API로 규정과 환율을 매일 갱신해야 해요.',
    rows: [
      { name: '향수 50ml', category: 'cosmetics' as Category, price: '230' },
      { name: '무선 이어폰', category: 'electronics' as Category, price: '249' },
    ],
  },
  en: {
    to: 'Flying into', residency: 'Traveler is a', resident: 'Resident', visitor: 'Visitor', bag: 'In the bag',
    name: 'Item name', type: 'type', price: 'unit price (USD)', qty: 'quantity', del: 'Remove', add: '+ Add item',
    summary: 'entry rules at a glance', limit: 'General duty-free limit', rate: 'Estimated tax on the excess: about',
    note: 'Amounts in USD at fixed demo exchange rates. Rules change — always check official customs guidance.',
    rows: [
      { name: 'Perfume 50ml', category: 'cosmetics' as Category, price: '230' },
      { name: 'Wireless earbuds', category: 'electronics' as Category, price: '249' },
    ],
  },
};

export default function Calculator({ lang = 'ko' }: { lang?: Lang }) {
  const tx = TEXT[lang];
  const [to, setTo] = useState<CountryCode>('KR');
  const [resident, setResident] = useState(true);
  const [rows, setRows] = useState<Row[]>(tx.rows.map((r, i) => ({ key: i + 1, qty: '1', ...r })));

  const items = rows.map((r) => ({ name: r.name, category: r.category, unitUSD: Number(r.price) || 0, qty: Math.max(1, Number(r.qty) || 1) }));
  const result = evaluate({ to, resident, items, lang });
  const country = COUNTRIES[to];
  const ct = countryText(to, lang);

  const patch = (key: number, p: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...p } : r)));

  return (
    <div className="grid-2" style={{ alignItems: 'start' }}>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="calc-to">{tx.to}</label>
            <CountrySelect id="calc-to" value={to} onChange={setTo} lang={lang} />
          </div>
          <div className="field">
            <span className="label">{tx.residency}</span>
            <div className="pills">
              <button type="button" className="pill" aria-pressed={resident} onClick={() => setResident(true)}>{tx.resident}</button>
              <button type="button" className="pill" aria-pressed={!resident} onClick={() => setResident(false)}>{tx.visitor}</button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span className="label small" style={{ fontWeight: 600 }}>{tx.bag}</span>
          {rows.map((r, i) => (
            <div key={r.key} className="action-box" style={{ gap: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" aria-label={`${tx.name} ${i + 1}`} placeholder={tx.name} value={r.name} onChange={(e) => patch(r.key, { name: e.target.value })} />
                <button type="button" className="btn btn-danger btn-sm" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))} aria-label={`${tx.del} ${i + 1}`}>
                  {tx.del}
                </button>
              </div>
              <div className="form-grid calc-row">
                <select className="select" aria-label={`${i + 1} ${tx.type}`} value={r.category} onChange={(e) => patch(r.key, { category: e.target.value as Category })}>
                  {CATEGORY_LIST.map((c) => (
                    <option key={c.key} value={c.key}>{categoryText(c.key, lang).label}</option>
                  ))}
                </select>
                <input className="input" inputMode="decimal" aria-label={`${i + 1} ${tx.price}`} placeholder="$" value={r.price} onChange={(e) => patch(r.key, { price: e.target.value })} />
                <input className="input" inputMode="numeric" aria-label={`${i + 1} ${tx.qty}`} placeholder="1" value={r.qty} onChange={(e) => patch(r.key, { qty: e.target.value })} />
              </div>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-sm"
            style={{ alignSelf: 'flex-start' }}
            onClick={() => setRows((rs) => [...rs, { key: nextKey++, name: '', category: 'general', price: '', qty: '1' }])}
          >
            {tx.add}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <GuardPanel result={result} lang={lang} />
        <div className="card small">
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            {country.flag} {ct.name} {tx.summary}
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--ink-2)' }}>
            <li>{tx.limit}: {ct.allowanceNote}</li>
            {ct.extras.map((x) => (
              <li key={x}>{x}</li>
            ))}
            <li>{tx.rate} {Math.round(country.dutyRate * 100)}%</li>
          </ul>
          <p className="tiny muted" style={{ marginTop: 10 }}>{tx.note}</p>
        </div>
      </div>
    </div>
  );
}
