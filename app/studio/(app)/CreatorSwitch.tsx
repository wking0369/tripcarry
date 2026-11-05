'use client';

import { useTransition } from 'react';
import { selectCreator } from '../actions';

export default function CreatorSwitch({ current, creators }: { current?: string; creators: { id: string; name: string }[] }) {
  const [pending, start] = useTransition();
  return (
    <div className="hub-switch">
      <label htmlFor="creator">계정</label>
      <select id="creator" value={current} disabled={pending} onChange={(e) => { const id = e.target.value; start(() => selectCreator(id)); }}>
        {creators.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
    </div>
  );
}
