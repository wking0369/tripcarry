'use client';

import { useState } from 'react';
import { assetUrl } from '@/lib/studio-draw';
import type { RefPost } from '@/lib/studio';
import { uploadImage } from './upload';

const THEME_LABEL = { light: '밝게', green: '초록', dark: '어둡게' } as const;

export default function RefsPanel({ refs, setRefs }: { refs: RefPost[]; setRefs: (f: (r: RefPost[]) => RefPost[]) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const add = async () => {
    if (!file) return;
    setBusy(true);
    setMsg('');
    try {
      const assetId = await uploadImage(file);
      const res = await fetch('/api/studio/refs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ assetId, note }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '저장하지 못했어요.');
      setRefs((r) => [data.ref, ...r]);
      setFile(null);
      setNote('');
      setMsg(data.warning || 'AI가 스타일을 읽어 뒀어요. AI로 만들 때 골라서 참고할 수 있어요.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '실패했어요.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('이 참고 게시물을 지울까요?')) return;
    await fetch(`/api/studio/refs?id=${id}`, { method: 'DELETE' });
    setRefs((r) => r.filter((x) => x.id !== id));
  };

  return (
    <div className="card refs">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <strong>참고 게시물 보관함</strong>
        <span className="tiny muted">{refs.length}개</span>
      </div>
      <p className="tiny muted">마음에 드는 인스타 게시물을 캡처해서 올리면, AI가 스타일(구성·말투·색)을 읽어 두고 새 게시물을 만들 때 참고해요.</p>
      <input className="file-input" type="file" accept="image/*" aria-label="참고 게시물 캡처" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      {file && (
        <>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="어디가 좋았나요? (예: 첫 장 문구, 색감)" maxLength={300} />
          <button type="button" className="btn btn-primary btn-sm" onClick={add} disabled={busy}>{busy ? 'AI가 스타일 읽는 중…' : '보관함에 추가'}</button>
        </>
      )}
      {msg && <div className="notice notice-info small">{msg}</div>}
      <div className="refs-grid">
        {refs.map((r) => (
          <div key={r.id} className="ref-item">
            <button type="button" className="ref-thumb" onClick={() => setOpen(open === r.id ? null : r.id)} aria-expanded={open === r.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={assetUrl(r.assetId)} alt={r.note || '참고 게시물'} loading="lazy" />
            </button>
            {open === r.id && (
              <div className="ref-detail small">
                {r.style ? (
                  <>
                    <p>{r.style.summary}</p>
                    <p className="tiny muted">표지: {r.style.hook} · 말투: {r.style.tone} · 색: {r.style.colors} ({THEME_LABEL[r.style.theme]})</p>
                  </>
                ) : (
                  <p className="tiny muted">스타일 분석이 아직 없어요 (AI 키 연결 후 다시 올려 주세요).</p>
                )}
                {r.note && <p className="tiny">메모: {r.note}</p>}
                <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(r.id)}>삭제</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
