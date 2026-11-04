'use client';

import '@fontsource/noto-sans-kr/500.css';
import '@fontsource/noto-sans-kr/700.css';
import '@fontsource/noto-sans-kr/900.css';
import '@fontsource/black-han-sans/400.css';
import '@fontsource/do-hyeon/400.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { parseSrt, toSrt } from '@/lib/hub/srt';
import { cueToPng, drawCue, fontString } from '@/lib/hub/subtitle-draw';
import { FONTS, type Cue, type Render, type SubtitleProject, type SubtitleStyle } from '@/lib/hub/types';
import { aiDraftCues, createProject, deleteProject, saveProject } from '../../actions';

const MB = 1024 * 1024;

function upload(file: File, onProgress: (p: number) => void) {
  return new Promise<{ id: string; bytes: number }>((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open('POST', '/api/hub/upload');
    x.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    x.onload = () => {
      let data: { id?: string; bytes?: number; error?: string } = {};
      try {
        data = JSON.parse(x.responseText);
      } catch {
        /* 아래에서 처리 */
      }
      if (x.status === 200 && data.id) resolve({ id: data.id, bytes: data.bytes ?? file.size });
      else reject(new Error(data.error || '영상을 올리지 못했어요.'));
    };
    x.onerror = () => reject(new Error('연결이 끊겨 영상을 올리지 못했어요.'));
    x.send(file);
  });
}

function probe(file: File) {
  return new Promise<{ width: number; height: number; duration: number }>((resolve, reject) => {
    const v = document.createElement('video');
    const url = URL.createObjectURL(file);
    v.preload = 'metadata';
    v.onloadedmetadata = () => {
      resolve({ width: v.videoWidth, height: v.videoHeight, duration: v.duration });
      URL.revokeObjectURL(url);
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('브라우저에서 이 영상을 읽지 못했어요. H.264 MP4로 바꿔서 올려 주세요.'));
    };
    v.src = url;
  });
}

function reelWarnings(p: { width: number; height: number; duration: number }, bytes?: number) {
  const out: string[] = [];
  if (Math.abs(p.width / p.height - 9 / 16) > 0.02) out.push(`화면 비율이 9:16이 아니에요 (${p.width}×${p.height}).`);
  if (p.duration < 5 || p.duration > 90) out.push(`길이가 ${Math.round(p.duration)}초예요. 릴스 탭 노출은 5~90초 영상만 돼요.`);
  if (bytes && bytes > 100 * MB) out.push(`파일이 ${Math.round(bytes / MB)}MB예요. 인스타 API로 올리려면 100MB 이하여야 해요.`);
  return out;
}

const clock = (t: number) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;

export default function SubtitleDesk({ creatorId, projects, project, aiReady }: { creatorId: string; projects: SubtitleProject[]; project: SubtitleProject | null; aiReady: boolean }) {
  return project ? <Editor project={project} aiReady={aiReady} /> : <ProjectList creatorId={creatorId} projects={projects} />;
}

function ProjectList({ creatorId, projects }: { creatorId: string; projects: SubtitleProject[] }) {
  const router = useRouter();
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');

  async function choose(file: File) {
    setError('');
    setProgress(0);
    try {
      const meta = await probe(file);
      const saved = await upload(file, setProgress);
      const r = await createProject({ creatorId, title: file.name.replace(/\.[^.]+$/, ''), videoId: saved.id, videoBytes: saved.bytes, ...meta });
      if (r?.error || !r?.id) throw new Error(r?.error || '프로젝트를 만들지 못했어요.');
      router.push(`/studio/subtitles?p=${r.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '영상을 올리지 못했어요.');
      setProgress(null);
    }
  }

  return (
    <>
      <header className="page-head">
        <div>
          <h1>자막 편집</h1>
          <p>기존 자막을 지운 영상을 올리고, 폰트와 크기와 위치를 정해서 영상에 입혀요.</p>
        </div>
      </header>
      <label className="drop">
        <input type="file" accept="video/mp4,video/quicktime,.mp4,.mov" onChange={(e) => e.target.files?.[0] && choose(e.target.files[0])} disabled={progress !== null} />
        <b>{progress === null ? '영상 올리기' : `올리는 중 ${Math.round(progress * 100)}%`}</b>
        <span>MP4 또는 MOV, 500MB까지</span>
      </label>
      {error && <p className="msg msg-error" role="alert">{error}</p>}
      {projects.length > 0 && (
        <ul className="list">
          {projects.map((p) => (
            <li key={p.id}>
              <Link className="cell-title" href={`/studio/subtitles?p=${p.id}`}>{p.title}<small>자막 {p.cues.length}개, 완성 영상 {p.renders.length}개, {p.width}×{p.height}, {Math.round(p.duration)}초</small></Link>
              <button className="link-btn danger" type="button" onClick={() => confirm(`"${p.title}" 프로젝트와 영상을 지울까요?`) && deleteProject(p.id)}>삭제</button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Editor({ project, aiReady }: { project: SubtitleProject; aiReady: boolean }) {
  const [title, setTitle] = useState(project.title);
  const [cues, setCues] = useState<Cue[]>(project.cues);
  const [style, setStyle] = useState<SubtitleStyle>(project.style);
  const [styleName, setStyleName] = useState(project.styleName);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(0);
  const [guide, setGuide] = useState(true);
  const [saved, setSaved] = useState('저장됨');
  const [aiBusy, setAiBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [renders, setRenders] = useState<Render[]>(project.renders);
  const [job, setJob] = useState<'idle' | 'preparing' | 'running'>(project.job?.status === 'running' ? 'running' : 'idle');
  const [jobError, setJobError] = useState(project.job?.status === 'failed' ? project.job.error ?? '' : '');

  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const drag = useRef(false);
  const first = useRef(true);
  const W = project.width;
  const H = project.height;

  // 수정하면 잠시 뒤 자동 저장
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSaved('저장 중');
    const t = setTimeout(async () => {
      const r = await saveProject(project.id, { title, cues, style, styleName });
      setSaved(r?.error ? r.error : '저장됨');
    }, 700);
    return () => clearTimeout(t);
  }, [project.id, title, cues, style, styleName]);

  const active = cues.findIndex((c) => current >= c.start && current < c.end);
  // 재생 위치에 자막이 없으면 고른 자막을 보여 줘서 스타일을 맞출 수 있게 한다
  const shownText = active >= 0 ? cues[active].text : cues[selected]?.text ?? '여기에 자막이 나와요';

  const paint = useCallback(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);
    drawCue(ctx, shownText, style, W, H);
  }, [shownText, style, W, H]);

  useEffect(() => {
    let live = true;
    paint();
    document.fonts.load(fontString(style, 64), shownText).then(() => live && paint()).catch(() => {});
    return () => {
      live = false;
    };
  }, [paint, style, shownText]);

  useEffect(() => {
    if (job !== 'running') return;
    const t = setInterval(async () => {
      const res = await fetch(`/api/hub/render/${project.id}`).catch(() => null);
      const data = res?.ok ? await res.json() : null;
      if (!data) return;
      setRenders(data.renders);
      if (!data.job) setJob('idle');
      else if (data.job.status === 'failed') {
        setJob('idle');
        setJobError(data.job.error || '영상을 만들지 못했어요.');
      }
    }, 2000);
    return () => clearInterval(t);
  }, [job, project.id]);

  const set = <K extends keyof SubtitleStyle>(k: K, v: SubtitleStyle[K]) => setStyle((s) => ({ ...s, [k]: v }));
  const setCue = (i: number, patch: Partial<Cue>) => setCues((list) => list.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  function seek(t: number) {
    if (video.current) video.current.currentTime = t;
    setCurrent(t);
  }

  function dragTo(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    setStyle((s) => ({ ...s, xPct: Math.round(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)) * 10) / 10, yPct: Math.round(Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100)) * 10) / 10 }));
  }

  function addCue() {
    const start = Math.round(current * 10) / 10;
    const next = [...cues, { start, end: Math.min(project.duration, start + 2.5), text: '새 자막' }].sort((a, b) => a.start - b.start);
    setCues(next);
    setSelected(next.findIndex((c) => c.start === start));
  }

  async function importSrt(file: File) {
    const parsed = parseSrt(await file.text());
    if (!parsed.length) setNotice('SRT에서 자막을 찾지 못했어요. 파일 형식을 확인해 주세요.');
    else {
      setCues(parsed);
      setNotice(`자막 ${parsed.length}개를 가져왔어요.`);
    }
  }

  function downloadSrt() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([toSrt(cues)], { type: 'text/plain' }));
    a.download = `${title}.srt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function draft() {
    if (cues.length && !confirm('지금 자막을 AI 초안으로 바꿀까요?')) return;
    setAiBusy(true);
    setNotice('');
    const r = await aiDraftCues(project.id);
    setAiBusy(false);
    if (r.error || !r.cues) setNotice(r.error ?? '자막 초안을 만들지 못했어요.');
    else {
      setCues(r.cues);
      setNotice('자막 초안을 만들었어요. 읽어 보고 고쳐 주세요.');
    }
  }

  async function render() {
    const list = cues.filter((c) => c.text.trim());
    if (!list.length) return setJobError('입힐 자막이 없어요.');
    setJobError('');
    setJob('preparing');
    try {
      await saveProject(project.id, { title, cues, style, styleName });
      const form = new FormData();
      const manifest = [];
      for (let i = 0; i < list.length; i++) {
        const png = await cueToPng(list[i].text, style, W, H);
        form.append(`cue${i}`, png.blob, `${i}.png`);
        manifest.push({ x: png.x, y: png.y, start: list[i].start, end: list[i].end });
      }
      form.append('manifest', JSON.stringify(manifest));
      form.append('label', styleName);
      const res = await fetch(`/api/hub/render/${project.id}`, { method: 'POST', body: form });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || '영상을 만들지 못했어요.');
      setJob('running');
    } catch (e) {
      setJob('idle');
      setJobError(e instanceof Error ? e.message : '영상을 만들지 못했어요.');
    }
  }

  const fontInfo = FONTS.find((f) => f.family === style.font) ?? FONTS[0];
  const warnings = reelWarnings(project);

  return (
    <>
      <header className="page-head">
        <div>
          <Link href="/studio/subtitles" className="back">자막 편집 목록</Link>
          <input className="title-input" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="프로젝트 이름" />
        </div>
        <span className="saved" role="status">{saved}</span>
      </header>
      {warnings.map((w) => <p key={w} className="msg msg-warn">{w}</p>)}

      <div className="editor">
        <div className="stage-col">
          <div className="stage" style={{ aspectRatio: `${W} / ${H}` }}>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video ref={video} src={`/api/hub/media/${project.videoId}`} playsInline onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)} onSeeked={(e) => setCurrent(e.currentTarget.currentTime)} />
            <canvas
              ref={canvas}
              width={W}
              height={H}
              aria-label="자막 미리보기. 끌어서 위치를 옮겨요"
              onPointerDown={(e) => {
                drag.current = true;
                e.currentTarget.setPointerCapture(e.pointerId);
                dragTo(e);
              }}
              onPointerMove={(e) => drag.current && dragTo(e)}
              onPointerUp={() => {
                drag.current = false;
              }}
            />
            {guide && <div className="safe" aria-hidden="true"><span>이 아래는 인스타 화면에 가려질 수 있어요 (대략)</span></div>}
          </div>
          <div className="transport">
            <button className="btn btn-small" type="button" onClick={() => (video.current?.paused ? video.current.play() : video.current?.pause())}>재생/정지</button>
            <input type="range" aria-label="재생 위치" min={0} max={project.duration} step={0.05} value={current} onChange={(e) => seek(Number(e.target.value))} />
            <span className="time">{clock(current)} / {clock(project.duration)}</span>
          </div>
          <label className="check"><input type="checkbox" checked={guide} onChange={(e) => setGuide(e.target.checked)} />가려지는 영역 표시</label>
        </div>

        <div className="controls">
          <h2>자막 스타일</h2>
          <p className="hint">미리보기에서 자막을 끌어 위치를 옮길 수 있어요.</p>
          <div className="form form-grid2">
            <label>폰트
              <select value={style.font} onChange={(e) => {
                const f = FONTS.find((x) => x.family === e.target.value)!;
                setStyle((s) => ({ ...s, font: f.family, weight: f.weights.includes(s.weight) ? s.weight : f.weights[f.weights.length - 1] }));
              }}>
                {FONTS.map((f) => <option key={f.family} value={f.family}>{f.family}</option>)}
              </select>
            </label>
            <label>굵기
              <select value={style.weight} onChange={(e) => set('weight', Number(e.target.value))}>{fontInfo.weights.map((w) => <option key={w} value={w}>{w}</option>)}</select>
            </label>
            <label className="span2">글자 크기 {style.size}<input type="range" min={24} max={200} value={style.size} onChange={(e) => set('size', Number(e.target.value))} /></label>
            <label>가로 위치 {style.xPct}%<input type="range" min={0} max={100} step={0.5} value={style.xPct} onChange={(e) => set('xPct', Number(e.target.value))} /></label>
            <label>세로 위치 {style.yPct}%<input type="range" min={0} max={100} step={0.5} value={style.yPct} onChange={(e) => set('yPct', Number(e.target.value))} /></label>
            <label>줄 너비 {style.maxWidthPct}%<input type="range" min={30} max={100} value={style.maxWidthPct} onChange={(e) => set('maxWidthPct', Number(e.target.value))} /></label>
            <label>줄 간격 {style.lineHeight.toFixed(1)}<input type="range" min={1} max={2} step={0.1} value={style.lineHeight} onChange={(e) => set('lineHeight', Number(e.target.value))} /></label>
            <label>글자 색<input type="color" value={style.color} onChange={(e) => set('color', e.target.value)} /></label>
            <label>테두리 색<input type="color" value={style.strokeColor} onChange={(e) => set('strokeColor', e.target.value)} /></label>
            <label className="span2">테두리 두께 {style.strokeWidth}<input type="range" min={0} max={30} value={style.strokeWidth} onChange={(e) => set('strokeWidth', Number(e.target.value))} /></label>
            <label className="check span2"><input type="checkbox" checked={style.boxOn} onChange={(e) => set('boxOn', e.target.checked)} />글자 뒤에 박스 넣기</label>
            {style.boxOn && (
              <>
                <label>박스 색<input type="color" value={style.boxColor} onChange={(e) => set('boxColor', e.target.value)} /></label>
                <label>박스 진하기 {Math.round(style.boxOpacity * 100)}%<input type="range" min={0} max={1} step={0.05} value={style.boxOpacity} onChange={(e) => set('boxOpacity', Number(e.target.value))} /></label>
              </>
            )}
            <label className="span2">스타일 이름 (분석에 쓰여요)<input value={styleName} onChange={(e) => setStyleName(e.target.value)} placeholder="노란 큰자막" /></label>
          </div>

          <h2>완성 영상</h2>
          <button className="btn btn-main" type="button" disabled={job !== 'idle'} onClick={render}>{job === 'preparing' ? '자막 준비 중' : job === 'running' ? '영상 만드는 중' : '자막 입힌 영상 만들기'}</button>
          {jobError && <p className="msg msg-error" role="alert">{jobError}</p>}
          {renders.length > 0 && (
            <ul className="list list-tight">
              {renders.map((r) => (
                <li key={r.id}>
                  <span className="cell-title">{r.label}<small>{(r.bytes / MB).toFixed(1)}MB{r.bytes > 100 * MB ? ', 인스타 API 제한 100MB 초과' : ''}</small></span>
                  <a className="btn btn-small" href={`/api/hub/media/${r.mediaId}?download=${encodeURIComponent(title)}`}>받기</a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <section>
        <div className="sec-head">
          <h2>자막 {cues.length}개</h2>
          <div className="row-actions">
            <button className="btn btn-small" type="button" onClick={addCue}>지금 위치에 추가</button>
            <label className="btn btn-small file-btn">SRT 가져오기<input type="file" accept=".srt,text/plain" onChange={(e) => e.target.files?.[0] && importSrt(e.target.files[0])} /></label>
            <button className="btn btn-small" type="button" disabled={!cues.length} onClick={downloadSrt}>SRT 받기</button>
            <button className="btn btn-small" type="button" disabled={aiBusy || !aiReady} title={aiReady ? '' : 'OPENAI_API_KEY가 필요해요'} onClick={draft}>{aiBusy ? 'AI 작업 중' : 'AI 한국어 초안'}</button>
          </div>
        </div>
        {!aiReady && <p className="hint">AI 초안은 Railway 변수에 OPENAI_API_KEY를 넣으면 쓸 수 있어요.</p>}
        {notice && <p className="msg msg-ok" role="status">{notice}</p>}
        {cues.length ? (
          <ol className="cues">
            {cues.map((c, i) => (
              <li key={i} className={i === active ? 'on' : undefined}>
                <button className="btn btn-small" type="button" onClick={() => { setSelected(i); seek(c.start); }}>이동</button>
                <label>시작<input type="number" step={0.1} min={0} value={c.start} onChange={(e) => setCue(i, { start: Number(e.target.value) })} /></label>
                <label>끝<input type="number" step={0.1} min={0} value={c.end} onChange={(e) => setCue(i, { end: Number(e.target.value) })} /></label>
                <label className="cue-text">자막<textarea rows={2} value={c.text} onFocus={() => setSelected(i)} onChange={(e) => setCue(i, { text: e.target.value })} /></label>
                <button className="link-btn danger" type="button" onClick={() => setCues((l) => l.filter((_, j) => j !== i))}>삭제</button>
              </li>
            ))}
          </ol>
        ) : <p className="empty-line">SRT를 가져오거나 지금 위치에 자막을 추가해 주세요.</p>}
      </section>
    </>
  );
}
