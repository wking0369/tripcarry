'use client';

import { useState, useTransition } from 'react';
import { createVariant } from '../../actions';

export default function VariantButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState('');
  return (
    <>
      <button
        className="btn btn-small"
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await createVariant(id);
            setMsg(r?.error ?? '');
            if (!r?.error) window.scrollTo({ top: 0, behavior: 'smooth' });
          })
        }
      >
        {pending ? '만드는 중' : '변형본 만들기'}
      </button>
      {msg && <span className="msg-inline" role="alert">{msg}</span>}
    </>
  );
}
