'use client';

import '@fontsource/noto-sans-kr/500.css';
import '@fontsource/noto-sans-kr/700.css';
import '@fontsource/noto-sans-kr/900.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Creator, Entry } from '@/lib/hub/types';
import { recordCardPost } from '../../actions';

// 입력한 문장을 그대로 1080×1350 카드에 그린다. 문장을 바꾸거나 새로 쓰지 않는다.
const SIZE = { w: 1080, h: 1350 };
const THEMES = {
  ink: { name: '검정', bg: '#15171A', text: '#F8F5EC', sub: '#C9C6BC', accent: '#FFD60A' },
  yellow: { name: '노랑', bg: '#FFD60A', text: '#15171A', sub: '#3D3A22', accent: '#15171A' },
  paper: { name: '종이', bg: '#F8F5EC', text: '#15171A', sub: '#55585C', accent: '#C2255C' },
} as const;
type ThemeKey = keyof typeof THEMES;
type Kind = 'quotes' | 'career';
type Slide = { type: 'cover'; title: string } | { type: 'quote'; entry: Entry } | { type: 'career'; rows: Entry[]; page: number; pages: number };

const FONT = '"Noto Sans KR", sans-serif';

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(/(\s+)/)) {
      if (!word) continue;
      if (ctx.measureText(line + word).width <= max || !line.trim()) {
        if (ctx.measureText(line + word).width > max) {
          for (const ch of word) {
            if (ctx.measureText(line + ch).width > max && line) {
              out.push(line);
              line = ch;
            } else line += ch;
          }
        } else line += word;
      } else {
        out.push(line.trimEnd());
        line = word.trimStart();
      }
    }
    out.push(line.trimEnd());
  }
  return out;
}

function fit(ctx: CanvasRenderingContext2D, text: string, weight: number, max: number, maxH: number, start: number, min: number) {
  let size = start;
  for (;;) {
    ctx.font = `${weight} ${size}px ${FONT}`;
    const lines = wrap(ctx, text, max);
    if (lines.length * size * 1.35 <= maxH || size <= min) return { size, lines };
    size -= 4;
  }
}

function draw(c: HTMLCanvasElement, slide: Slide, themeKey: ThemeKey, creator: Creator, index: number, total: number) {
  const t = THEMES[themeKey];
  const ctx = c.getContext('2d')!;
  const M = 96;
  const w = SIZE.w - M * 2;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, SIZE.w, SIZE.h);

  if (slide.type === 'cover') {
    const { size, lines } = fit(ctx, slide.title, 900, w, 800, 124, 64);
    ctx.fillStyle = t.text;
    ctx.font = `900 ${size}px ${FONT}`;
    let y = 420;
    lines.forEach((l) => {
      ctx.fillText(l, M, y);
      y += size * 1.25;
    });
    ctx.fillStyle = t.accent;
    ctx.fillRect(M, y - size * 0.4, 140, 12);
  } else if (slide.type === 'quote') {
    const { size, lines } = fit(ctx, slide.entry.text, 700, w, 820, 76, 36);
    ctx.fillStyle = t.accent;
    ctx.font = `900 200px ${FONT}`;
    ctx.fillText('“', M - 8, 300);
    ctx.fillStyle = t.text;
    ctx.font = `700 ${size}px ${FONT}`;
    let y = 380;
    lines.forEach((l) => {
      ctx.fillText(l, M, y);
      y += size * 1.35;
    });
    if (slide.entry.label) {
      ctx.fillStyle = t.sub;
      ctx.font = `500 34px ${FONT}`;
      ctx.fillText(slide.entry.label, M, Math.min(y + 40, 1160));
    }
  } else {
    ctx.fillStyle = t.text;
    ctx.font = `900 72px ${FONT}`;
    ctx.fillText(slide.pages > 1 ? `걸어온 길 ${slide.page}/${slide.pages}` : '걸어온 길', M, 190);
    let y = 300;
    for (const row of slide.rows) {
      ctx.fillStyle = t.accent;
      ctx.font = `700 34px ${FONT}`;
      ctx.fillText(row.label, M, y);
      y += 58;
      const { size, lines } = fit(ctx, row.text, 700, w, 150, 46, 32);
      ctx.fillStyle = t.text;
      ctx.font = `700 ${size}px ${FONT}`;
      lines.forEach((l) => {
        ctx.fillText(l, M, y);
        y += size * 1.35;
      });
      y += 44;
    }
  }

  ctx.fillStyle = t.sub;
  ctx.font = `500 30px ${FONT}`;
  if (creator.handle) ctx.fillText(`@${creator.handle}`, M, SIZE.h - 72);
  ctx.textAlign = 'right';
  ctx.fillText(`${index + 1}/${total}`, SIZE.w - M, SIZE.h - 72);
}

function slidesFrom(kind: Kind, picked: Entry[], cover: string): Slide[] {
  const out: Slide[] = cover.trim() ? [{ type: 'cover', title: cover.trim() }] : [];
  if (kind === 'quotes') return [...out, ...picked.map((entry) => ({ type: 'quote' as const, entry }))];
  const PER = 5;
  const pages = Math.ceil(picked.length / PER);
  for (let i = 0; i < pages; i++) out.push({ type: 'career', rows: picked.slice(i * PER, i * PER + PER), page: i + 1, pages });
  return out;
}

function Preview({ slide, theme, creator, index, total, onCanvas }: { slide: Slide; theme: ThemeKey; creator: Creator; index: number; total: number; onCanvas: (i: number, c: HTMLCanvasElement | null) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    onCanvas(index, ref.current);
    let live = true;
    const sample = slide.type === 'cover' ? slide.title : slide.type === 'quote' ? `${slide.entry.text}${slide.entry.label}` : slide.rows.map((r) => r.text + r.label).join('');
    const text = `${sample}걸어온길0123456789/@${creator.handle}“`;
    Promise.all([500, 700, 900].map((w) => document.fonts.load(`${w} 40px "Noto Sans KR"`, text))).catch(() => {}).finally(() => {
      if (live && ref.current) draw(ref.current, slide, theme, creator, index, total);
    });
    return () => {
      live = false;
    };
  }, [slide, theme, creator, index, total, onCanvas]);
  return <canvas ref={ref} width={SIZE.w} height={SIZE.h} aria-label={`카드 ${index + 1}`} />;
}

export default function CardStudio({ creator }: { creator: Creator }) {
  const [kind, setKind] = useState<Kind>('quotes');
  const [theme, setTheme] = useState<ThemeKey>('ink');
  const [cover, setCover] = useState('');
  const [off, setOff] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState('');
  const canvases = useRef(new Map<number, HTMLCanvasElement>());
  const onCanvas = useRef((i: number, c: HTMLCanvasElement | null) => {
    if (c) canvases.current.set(i, c);
    else canvases.current.delete(i);
  }).current;

  const source = kind === 'quotes' ? creator.quotes : creator.career;
  const picked = useMemo(() => source.filter((e) => !off.has(e.id)), [source, off]);
  const slides = useMemo(() => slidesFrom(kind, picked, cover), [kind, picked, cover]);

  async function save() {
    for (let i = 0; i < slides.length; i++) {
      const c = canvases.current.get(i);
      if (!c) continue;
      const blob = await new Promise<Blob | null>((res) => c.toBlob(res, 'image/png'));
      if (!blob) continue;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${creator.handle || 'card'}-${kind}-${String(i + 1).padStart(2, '0')}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      await new Promise((r) => setTimeout(r, 250));
    }
    setMsg(`카드 ${slides.length}장을 받았어요.`);
  }

  async function record() {
    const title = cover.trim() || (kind === 'quotes' ? `${creator.name} 명언 모음` : `${creator.name} 경력 카드`);
    const r = await recordCardPost(creator.id, title, `${THEMES[theme].name} ${kind === 'quotes' ? '명언 카드' : '경력 카드'}`, kind === 'quotes' ? '명언' : '경력');
    setMsg(r?.error ?? '보관함에 기록했어요. 올린 뒤 수치를 입력해 주세요.');
  }

  return (
    <section className="cards">
      <div className="sec-head">
        <h2>카드뉴스 만들기</h2>
        <div className="row-actions">
          <button className="btn btn-main" type="button" disabled={!slides.length} onClick={save}>PNG로 받기</button>
          <button className="btn" type="button" disabled={!slides.length} onClick={record}>보관함에 기록</button>
        </div>
      </div>
      {msg && <p className="msg msg-ok" role="status">{msg}</p>}
      <div className="form form-row">
        <label>내용
          <select value={kind} onChange={(e) => setKind(e.target.value as Kind)}><option value="quotes">명언 모음</option><option value="career">경력</option></select>
        </label>
        <label>색
          <select value={theme} onChange={(e) => setTheme(e.target.value as ThemeKey)}>{(Object.keys(THEMES) as ThemeKey[]).map((k) => <option key={k} value={k}>{THEMES[k].name}</option>)}</select>
        </label>
        <label className="grow">표지 문구 (비우면 표지 없음)<input value={cover} onChange={(e) => setCover(e.target.value)} placeholder={kind === 'quotes' ? '오늘 다시 꺼내 볼 문장들' : '이 사람은 어떻게 여기까지 왔을까'} /></label>
      </div>
      {source.length > 0 && (
        <fieldset className="pick">
          <legend>넣을 항목</legend>
          {source.map((e) => (
            <label className="check" key={e.id}>
              <input type="checkbox" checked={!off.has(e.id)} onChange={(ev) => setOff((s) => {
                const n = new Set(s);
                if (ev.target.checked) n.delete(e.id);
                else n.add(e.id);
                return n;
              })} />
              {e.text.length > 40 ? `${e.text.slice(0, 40)}…` : e.text}
            </label>
          ))}
        </fieldset>
      )}
      {slides.length ? (
        <div className="card-strip">
          {slides.map((s, i) => <Preview key={`${kind}-${i}`} slide={s} theme={theme} creator={creator} index={i} total={slides.length} onCanvas={onCanvas} />)}
        </div>
      ) : <p className="empty-line">{kind === 'quotes' ? '아래에서 명언을 추가해 주세요.' : '아래에서 경력을 추가해 주세요.'}</p>}
    </section>
  );
}
