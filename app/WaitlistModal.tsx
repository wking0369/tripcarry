'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_ROUTE, ROUTE_CODES, WAITLIST_COUNTRIES, countryName, type RouteKey } from '@/lib/i18n';
import { useSite } from './Site';

type Role = 'buyer' | 'traveler' | 'both';
const ROUTES: RouteKey[] = ['JP-KR', 'KR-JP', 'other'];
const KINDS = ['resident', 'student', 'business', 'traveler'] as const;
const TRIPS = ['1-2', '3-5', '6-11', '12+'] as const;
const KGS = ['1', '1-3', '3-5', '5+'] as const;

function Pills<T extends string>({ options, value, onChange, label }: { options: readonly T[]; value: T | ''; onChange: (v: T) => void; label: (v: T) => string }) {
  return (
    <div className="pills">
      {options.map((o) => (
        <button key={o} type="button" className="pill" aria-pressed={value === o} onClick={() => onChange(o)}>
          {label(o)}
        </button>
      ))}
    </div>
  );
}

export default function WaitlistModal({
  initialRole,
  initialRoute,
  initialItem = '',
  onClose,
}: {
  initialRole: Role;
  initialRoute?: RouteKey;
  initialItem?: string;
  onClose: () => void;
}) {
  const { t, lang, visitor } = useSite();
  const m = t.modal;
  const [role, setRole] = useState<Role>(initialRole);
  const [email, setEmail] = useState('');
  const [route, setRoute] = useState<RouteKey>(initialRoute ?? DEFAULT_ROUTE[lang]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [item, setItem] = useState(initialItem);
  const [pay, setPay] = useState('');
  const [kind, setKind] = useState<(typeof KINDS)[number] | ''>('');
  const [trips, setTrips] = useState<(typeof TRIPS)[number] | ''>('');
  const [kg, setKg] = useState<(typeof KGS)[number] | ''>('');
  const [minPay, setMinPay] = useState('');
  const [website, setWebsite] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);
  const buys = role !== 'traveler';
  const carries = role !== 'buyer';

  const countries = useMemo(
    () =>
      WAITLIST_COUNTRIES.map((c) => ({ code: c, name: countryName(c, lang) }))
        .sort((a, b) => a.name.localeCompare(b.name, lang))
        .concat([{ code: 'OTHER', name: countryName('OTHER', lang) }]),
    [lang],
  );

  useEffect(() => {
    emailRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setState('sending');
    const { vid, src } = visitor();
    const codes = route === 'other' ? { from, to } : ROUTE_CODES[route];
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email,
          role,
          ...codes,
          item: buys ? item : '',
          pay: buys ? pay : '',
          kind: carries ? kind : '',
          trips: carries ? trips : '',
          kg: carries ? kg : '',
          minPay: carries ? minPay : '',
          website,
          vid,
          src,
          lang,
        }),
      });
      if (!res.ok) throw new Error(res.status === 400 ? m.errorEmail : res.status === 429 ? m.errorBusy : m.errorGeneric);
      try {
        localStorage.setItem('tc_joined', '1');
      } catch {
        /* 저장이 막힌 브라우저 */
      }
      setState('done');
    } catch (err) {
      setError(err instanceof Error && err.message !== 'Failed to fetch' ? err.message : m.errorGeneric);
      setState('idle');
    }
  };

  const opt = <span className="opt">{m.optional}</span>;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal card" role="dialog" aria-modal="true" aria-labelledby="wl-title" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-x" onClick={onClose} aria-label={m.close}>
          ×
        </button>
        {state === 'done' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
            <div className="done-mark" aria-hidden="true">✓</div>
            <h2 id="wl-title" className="modal-title">{m.doneTitle}</h2>
            <p className="muted">{m.doneSub}</p>
            <p className="small muted">{m.share}</p>
            <button type="button" className="btn btn-primary" onClick={onClose}>{m.close}</button>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <h2 id="wl-title" className="modal-title">{m.title}</h2>
              <p className="small muted" style={{ marginTop: 4 }}>{m.sub}</p>
            </div>
            <div className="field">
              <label htmlFor="wl-email">{m.email}</label>
              <input id="wl-email" ref={emailRef} className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="field">
              <span className="label">{m.role}</span>
              <Pills options={['buyer', 'traveler', 'both'] as const} value={role} onChange={setRole} label={(r) => m.roles[r]} />
            </div>
            <div className="field">
              <span className="label">{m.route}</span>
              <Pills options={ROUTES} value={route} onChange={setRoute} label={(r) => m.routes[r]} />
            </div>
            {route === 'other' && (
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="wl-from">{m.from} {opt}</label>
                  <select id="wl-from" className="select" value={from} onChange={(e) => setFrom(e.target.value)}>
                    <option value="">{m.pick}</option>
                    {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="wl-to">{m.to} {opt}</label>
                  <select id="wl-to" className="select" value={to} onChange={(e) => setTo(e.target.value)}>
                    <option value="">{m.pick}</option>
                    {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            )}
            {buys && (
              <>
                <div className="field">
                  <label htmlFor="wl-item">{m.item} {opt}</label>
                  <input id="wl-item" className="input" value={item} onChange={(e) => setItem(e.target.value)} placeholder={m.itemPh} maxLength={200} />
                </div>
                <div className="field">
                  <label htmlFor="wl-pay">{m.pay} {opt}</label>
                  <input id="wl-pay" className="input" inputMode="decimal" value={pay} onChange={(e) => setPay(e.target.value)} placeholder={m.payPh} maxLength={20} />
                </div>
              </>
            )}
            {carries && (
              <fieldset className="wl-supply">
                <legend>{m.supplyHead} {opt}</legend>
                <div className="field">
                  <span className="label">{m.kind}</span>
                  <Pills options={KINDS} value={kind} onChange={setKind} label={(k) => m.kinds[k]} />
                </div>
                <div className="field">
                  <span className="label">{m.trips}</span>
                  <Pills options={TRIPS} value={trips} onChange={setTrips} label={(k) => m.tripsOpts[k]} />
                </div>
                <div className="field">
                  <span className="label">{m.kg}</span>
                  <Pills options={KGS} value={kg} onChange={setKg} label={(k) => m.kgOpts[k]} />
                </div>
                <div className="field">
                  <label htmlFor="wl-minpay">{m.minPay}</label>
                  <input id="wl-minpay" className="input" inputMode="decimal" value={minPay} onChange={(e) => setMinPay(e.target.value)} placeholder={m.minPayPh} maxLength={20} />
                </div>
              </fieldset>
            )}
            {/* 봇 방지용 숨은 칸 */}
            <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={website} onChange={(e) => setWebsite(e.target.value)} name="website" />
            {error && <div className="notice notice-warn" role="alert" data-testid="wl-error">{error}</div>}
            <button className="btn btn-primary" type="submit" disabled={state === 'sending'}>
              {state === 'sending' ? m.sending : m.submit}
            </button>
            <p className="tiny muted">
              {m.consent} <Link href="/terms" onClick={onClose}>{t.terms}</Link> · <Link href="/privacy" onClick={onClose}>{t.privacy}</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
