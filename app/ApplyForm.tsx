'use client';

import { useState } from 'react';

export default function ApplyForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('sending');
    setError('');
    const res = await fetch('/api/apply', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))) }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok) setState('sent');
    else {
      setState('idle');
      setError(data.error || 'That didn’t send. Please email wking0369@gmail.com instead.');
    }
  }

  if (state === 'sent') return <p className="site-sent" role="status">Thanks. I’ll reply by email.</p>;

  return (
    <form className="site-form" onSubmit={submit}>
      <label>
        Your name
        <input name="name" required autoComplete="name" />
      </label>
      <label>
        Email
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label>
        Instagram handle
        <input name="handle" placeholder="@yourname" />
      </label>
      <label>
        What do you want off your plate?
        <textarea name="message" rows={4} />
      </label>
      <input className="site-hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      {error && <p className="site-error" role="alert">{error}</p>}
      <button type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Sending' : 'Send application'}</button>
      <p className="site-note">I only use this to reply to you.</p>
    </form>
  );
}
