'use client';

import { useActionState, useEffect, useRef } from 'react';
import type { Result } from '../actions';

// 서버 액션 결과(성공·오류 문구)를 폼 아래에 보여 준다.
export default function ActionForm({ action, children, className, resetOnOk }: { action: (prev: Result, f: FormData) => Promise<Result>; children: React.ReactNode; className?: string; resetOnOk?: boolean }) {
  const [state, run, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok && resetOnOk) ref.current?.reset();
  }, [state, resetOnOk]);
  return (
    <form ref={ref} action={run} className={className} aria-busy={pending}>
      {children}
      {state?.error && <p className="msg msg-error" role="alert">{state.error}</p>}
      {state?.ok && <p className="msg msg-ok" role="status">{state.ok}</p>}
    </form>
  );
}
