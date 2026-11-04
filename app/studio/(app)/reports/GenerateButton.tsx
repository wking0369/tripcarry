'use client';

import { useState, useTransition } from 'react';
import { generateReport } from '../../actions';

export default function GenerateButton({ creatorId, label }: { creatorId: string; label: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState('');
  return (
    <div className="stack-end">
      <button className="btn btn-main" type="button" disabled={pending} onClick={() => start(async () => setMsg((await generateReport(creatorId))?.error ?? ''))}>
        {pending ? '만드는 중' : label}
      </button>
      {msg && <span className="msg-inline" role="alert">{msg}</span>}
    </div>
  );
}
