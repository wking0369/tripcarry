'use client';

import { COUNTRIES, COUNTRY_LIST, countryText, fmt, fmtKRW, type CountryCode, type GuardResult, type Lang } from '@/lib/customs';
import { STATUS_LABEL, type Status } from '@/lib/store';

export function CountrySelect({ id, value, onChange, lang = 'ko' }: { id: string; value: CountryCode; onChange: (c: CountryCode) => void; lang?: Lang }) {
  return (
    <select id={id} className="select" value={value} onChange={(e) => onChange(e.target.value as CountryCode)}>
      {COUNTRY_LIST.map((c) => (
        <option key={c.code} value={c.code}>
          {c.flag} {countryText(c.code, lang).name}
        </option>
      ))}
    </select>
  );
}

export function Route({ from, to, fromCity, toCity }: { from: CountryCode; to: CountryCode; fromCity?: string; toCity?: string }) {
  return (
    <span className="route">
      {COUNTRIES[from].flag} {fromCity || COUNTRIES[from].name}
      <span className="arrow" aria-label="에서">→</span>
      {COUNTRIES[to].flag} {toCity || COUNTRIES[to].name}
    </span>
  );
}

export function usd(n: number) {
  // 결제 금액은 센트까지 항상 두 자리로
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function Money({ value, className }: { value: number; className?: string }) {
  return (
    <span className={className} title={`약 ${fmtKRW(value)}`}>
      {usd(value)}
    </span>
  );
}

const ZONE_TITLE = {
  safe: { icon: '✓', ko: '면세 안전 구역', en: 'Duty-free safe zone' },
  warn: { icon: '!', ko: '주의 — 신고·관세 선결제 필요', en: 'Caution — declare & prepay duty' },
  block: { icon: '✕', ko: '등록 불가 — 반입 금지 품목', en: 'Blocked — prohibited item' },
};

export function GuardPanel({ result, compact, lang = 'ko' }: { result: GuardResult; compact?: boolean; lang?: Lang }) {
  const t = ZONE_TITLE[result.zone];
  const en = lang === 'en';
  const existingPct = result.allowanceUSD > 0 ? Math.min(100, (result.existingUSD / result.allowanceUSD) * 100) : 0;
  return (
    <div className={`zone zone-${result.zone}`} role="status">
      <div className="zone-title">
        <span aria-hidden="true">{t.icon}</span>
        {en ? t.en : t.ko}
      </div>
      {result.zone !== 'block' && (
        <>
          <div className="meter" aria-label={en ? `${Math.round(result.usedPct)}% of duty-free limit used` : `면세 한도 ${Math.round(result.usedPct)}% 사용`}>
            {existingPct > 0 && <span className={`m-existing${result.existingUSD > result.allowanceUSD ? ' over' : ''}`} style={{ width: `${existingPct}%` }} />}
            <span
              className={result.excessUSD > 0 ? 'm-warn' : 'm-safe'}
              style={{ left: `${existingPct}%`, width: `${Math.max(result.usedPct - existingPct, result.countedUSD > 0 ? 1.5 : 0)}%` }}
            />
          </div>
          <div className="meter-legend">
            <span>
              {result.existingUSD > 0 && <>{en ? 'Already packed' : '이미 실은 물품'} {usd(result.existingUSD)} + </>}
              {en ? 'This' : '이번'} {usd(result.countedUSD)}
            </span>
            <span>
              {en ? 'Limit' : '한도'} {usd(result.allowanceUSD)}
              {result.excessUSD > 0 && <b style={{ color: 'var(--warn)' }}> · {usd(result.excessUSD)} {en ? 'over' : '초과'}</b>}
            </span>
          </div>
        </>
      )}
      {!compact && (
        <ul>
          {result.messages.map((m, i) => (
            <li key={i}>{m.text}</li>
          ))}
        </ul>
      )}
      {result.zone !== 'block' && result.estDutyUSD > 0 && (
        <div className="small">
          {en ? (
            <>
              Estimated duty <b>{usd(result.estDutyUSD)}</b> <span className="muted">(estimate)</span>
            </>
          ) : (
            <>
              예상 세금 <b>{usd(result.estDutyUSD)}</b> <span className="muted">(약 {fmtKRW(result.estDutyUSD)}, 추정치)</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const STATUS_CHIP: Record<Status, string> = {
  open: 'chip-info',
  matched: 'chip-warn',
  escrow: 'chip-ok',
  purchased: 'chip-ok',
  delivered: 'chip-ok',
  settled: 'chip-neutral',
  cancelled: 'chip-danger',
};

export function StatusChip({ status }: { status: Status }) {
  return <span className={`chip ${STATUS_CHIP[status]}`}>{STATUS_LABEL[status]}</span>;
}

export function Loading() {
  return <div className="empty">불러오는 중…</div>;
}
