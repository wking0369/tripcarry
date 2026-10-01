'use client';

// 카드 이미지를 캔버스에 그린다. 외부 라이브러리 없이 브라우저에서 PNG로 저장할 수 있다.
import { SIZES, type PostFormat, type PostLang, type Slide, type Theme } from './studio';

const C = {
  bg: '#f6f4ef',
  surface: '#ffffff',
  ink: '#1b1b1a',
  ink2: '#3b3832',
  muted: '#6b675f',
  line: '#e4e0d6',
  accent: '#0f6b5c',
  accentSoft: '#e6f0ec',
  warn: '#b45309',
  grey: '#c9c3b6',
};

const FONT = `'IBM Plex Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', system-ui, sans-serif`;

type Palette = { bg: string; text: string; sub: string; accent: string; card: string; cardText: string; chip: string; chipText: string };

function palette(theme: Theme): Palette {
  if (theme === 'green') return { bg: C.accent, text: '#ffffff', sub: '#d3e8e1', accent: '#9fe3cf', card: 'rgba(255,255,255,0.12)', cardText: '#ffffff', chip: 'rgba(255,255,255,0.16)', chipText: '#ffffff' };
  if (theme === 'dark') return { bg: C.ink, text: '#ffffff', sub: '#c9c3b6', accent: '#7fd6bd', card: 'rgba(255,255,255,0.08)', cardText: '#ffffff', chip: 'rgba(255,255,255,0.12)', chipText: '#ffffff' };
  return { bg: C.bg, text: C.ink, sub: C.ink2, accent: C.accent, card: C.surface, cardText: C.ink, chip: C.accentSoft, chipText: C.accent };
}

function font(weight: number, size: number) {
  return `${weight} ${size}px ${FONT}`;
}

/** 공백 기준으로 줄바꿈하고, 한 단어가 너무 길면 글자 단위로 자른다. \n은 강제 줄바꿈. */
function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(/(\s+)/)) {
      if (!word) continue;
      const test = line + word;
      if (ctx.measureText(test).width <= max || !line.trim()) {
        if (ctx.measureText(test).width > max) {
          // 단어 하나가 줄보다 길면 글자 단위로
          for (const ch of word) {
            if (ctx.measureText(line + ch).width > max && line) {
              out.push(line);
              line = ch;
            } else line += ch;
          }
        } else line = test;
      } else {
        out.push(line.trimEnd());
        line = word.trimStart();
      }
    }
    out.push(line.trimEnd());
  }
  return out;
}

/** 글자를 그리고 다음 y를 돌려준다. 너무 길면 글자 크기를 줄여 maxLines 안에 맞춘다. */
function text(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  o: { size: number; weight?: number; color: string; max: number; lh?: number; maxLines?: number; align?: CanvasTextAlign },
) {
  let size = o.size;
  let lines: string[];
  for (;;) {
    ctx.font = font(o.weight ?? 400, size);
    lines = wrap(ctx, s, o.max);
    if (!o.maxLines || lines.length <= o.maxLines || size <= 20) break;
    size -= 4;
  }
  const lh = size * (o.lh ?? 1.25);
  ctx.fillStyle = o.color;
  ctx.textAlign = o.align ?? 'left';
  ctx.textBaseline = 'top';
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lh));
  return y + lines.length * lh;
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

function chip(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, p: Palette, size = 30) {
  ctx.font = font(700, size);
  const w = ctx.measureText(s).width + size * 1.2;
  const h = size * 1.9;
  rr(ctx, x, y, w, h, h / 2, p.chip);
  ctx.fillStyle = p.chipText;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(s, x + size * 0.6, y + h / 2 + 1);
  return { w, h };
}

function brand(ctx: CanvasRenderingContext2D, p: Palette, M: number, theme: Theme) {
  rr(ctx, M, M, 64, 64, 16, theme === 'light' ? C.accent : '#ffffff');
  ctx.fillStyle = theme === 'light' ? '#ffffff' : C.accent;
  ctx.font = font(700, 36);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('T', M + 32, M + 34);
  ctx.textAlign = 'left';
  ctx.fillStyle = p.text;
  ctx.font = font(700, 36);
  ctx.fillText('TripCarry', M + 84, M + 34);
}

function footer(ctx: CanvasRenderingContext2D, p: Palette, W: number, H: number, M: number, lang: PostLang, theme: Theme, page?: string) {
  const label = lang === 'ko' ? '프로필 링크에서 사전 등록 →' : 'Join the waitlist — link in bio →';
  const h = 96;
  const y = H - M - h;
  rr(ctx, M, y, W - M * 2, h, 24, theme === 'light' ? C.accent : '#ffffff');
  ctx.fillStyle = theme === 'light' ? '#ffffff' : C.accent;
  ctx.font = font(700, 36);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, W / 2, y + h / 2 + 1);
  if (page) {
    ctx.fillStyle = p.sub;
    ctx.font = font(500, 28);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(page, W - M, M + 34);
  }
  return y;
}

export function drawSlide(ctx: CanvasRenderingContext2D, slide: Slide, format: PostFormat, lang: PostLang, page?: string) {
  const { w: W, h: H } = SIZES[format];
  const M = 80;
  const p = palette(slide.theme);
  const f = slide.fields;
  const tall = format === 'story';
  ctx.save();
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, W, H);

  // 배경 장식: 큰 원
  ctx.beginPath();
  ctx.arc(W - 40, tall ? 420 : 300, 260, 0, Math.PI * 2);
  ctx.fillStyle = slide.theme === 'light' ? 'rgba(15,107,92,0.06)' : 'rgba(255,255,255,0.06)';
  ctx.fill();

  brand(ctx, p, M, slide.theme);
  const bottom = footer(ctx, p, W, H, M, lang, slide.theme, page);
  const top = M + 64 + (tall ? 220 : 110);
  const maxW = W - M * 2;
  let y = top;

  switch (slide.template) {
    case 'hook': {
      if (f.tag) y += chip(ctx, f.tag, M, y, p).h + 44;
      y = text(ctx, f.headline ?? '', M, y, { size: 96, weight: 700, color: p.text, max: maxW, lh: 1.18, maxLines: 5 });
      y += 40;
      rr(ctx, M, y, 120, 10, 5, p.accent);
      y += 50;
      text(ctx, f.sub ?? '', M, y, { size: 46, weight: 500, color: p.sub, max: maxW, lh: 1.35, maxLines: 4 });
      break;
    }
    case 'benefits': {
      y = text(ctx, f.title ?? '', M, y, { size: 72, weight: 700, color: p.text, max: maxW, lh: 1.2, maxLines: 3 });
      y += 56;
      const room = bottom - 48 - y;
      const gap = 28;
      const h = Math.min(tall ? 260 : 210, (room - gap * 2) / 3);
      for (let i = 1; i <= 3; i++) {
        rr(ctx, M, y, maxW, h, 28, p.card);
        ctx.beginPath();
        ctx.arc(M + 70, y + h / 2, 40, 0, Math.PI * 2);
        ctx.fillStyle = p.accent;
        ctx.fill();
        ctx.fillStyle = slide.theme === 'light' ? '#ffffff' : C.ink;
        ctx.font = font(700, 40);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i), M + 70, y + h / 2 + 2);
        const ty = y + h / 2 - 50;
        text(ctx, f[`b${i}`] ?? '', M + 140, ty, { size: 48, weight: 700, color: p.cardText, max: maxW - 170, maxLines: 1 });
        text(ctx, f[`d${i}`] ?? '', M + 140, ty + 64, { size: 34, weight: 400, color: slide.theme === 'light' ? C.muted : p.sub, max: maxW - 170, maxLines: 1 });
        y += h + gap;
      }
      break;
    }
    case 'compare': {
      y = text(ctx, f.title ?? '', M, y, { size: 72, weight: 700, color: p.text, max: maxW, lh: 1.2, maxLines: 3 });
      y += 60;
      const vals = [1, 2, 3].map((i) => Math.max(0, Number(String(f[`v${i}`] ?? '').replace(/[^\d.]/g, '')) || 0));
      const max = Math.max(1, ...vals);
      const unit = f.unit ?? '';
      const fmt = (n: number) => (unit === '원' ? `${n.toLocaleString('ko-KR')}원` : `${unit}${n.toLocaleString('en-US')}`);
      const rowH = tall ? 230 : 190;
      for (let i = 0; i < 3; i++) {
        const best = i === 2;
        text(ctx, f[`l${i + 1}`] ?? '', M, y, { size: 38, weight: best ? 700 : 500, color: best ? p.accent : p.text, max: maxW, maxLines: 1 });
        const by = y + 62;
        rr(ctx, M, by, maxW, 84, 20, slide.theme === 'light' ? '#ece8df' : 'rgba(255,255,255,0.1)');
        const bw = Math.max(200, (vals[i] / max) * maxW);
        rr(ctx, M, by, bw, 84, 20, best ? (slide.theme === 'light' ? C.accent : '#ffffff') : C.grey);
        ctx.fillStyle = best && slide.theme !== 'light' ? C.accent : '#ffffff';
        ctx.font = font(700, 40);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(fmt(vals[i]), M + bw - 28, by + 44);
        y += rowH;
      }
      if (f.note) text(ctx, f.note, M, Math.min(y + 10, bottom - 80), { size: 28, color: p.sub, max: maxW, maxLines: 2 });
      break;
    }
    case 'route': {
      if (f.tag) y += chip(ctx, f.tag, M, y, p).h + 50;
      y = text(ctx, f.from ?? '', M, y, { size: 84, weight: 700, color: p.text, max: maxW, maxLines: 2 });
      y += 10;
      ctx.fillStyle = p.accent;
      ctx.font = font(700, 84);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('↓', M, y);
      y += 110;
      y = text(ctx, f.to ?? '', M, y, { size: 84, weight: 700, color: p.accent, max: maxW, maxLines: 2 });
      y += 60;
      let x = M;
      for (const item of (f.items ?? '').split(/,\s*/).filter(Boolean)) {
        ctx.font = font(700, 34);
        const w = ctx.measureText(item).width + 40;
        if (x + w > W - M) {
          x = M;
          y += 84;
        }
        chip(ctx, item, x, y, p, 34);
        x += w + 16;
      }
      y += 130;
      text(ctx, f.sub ?? '', M, y, { size: 44, weight: 500, color: p.sub, max: maxW, lh: 1.35, maxLines: 3 });
      break;
    }
    case 'traveler': {
      if (f.tag) y += chip(ctx, f.tag, M, y, p).h + 44;
      y = text(ctx, f.headline ?? '', M, y, { size: 92, weight: 700, color: p.text, max: maxW, lh: 1.18, maxLines: 4 });
      y += 60;
      rr(ctx, M, y, maxW, 150, 28, p.card);
      text(ctx, f.calc ?? '', M + 44, y + 50, { size: 44, weight: 700, color: slide.theme === 'light' ? C.accent : p.accent, max: maxW - 88, maxLines: 1 });
      y += 210;
      text(ctx, f.sub ?? '', M, y, { size: 44, weight: 500, color: p.sub, max: maxW, lh: 1.35, maxLines: 3 });
      break;
    }
    case 'steps': {
      y = text(ctx, f.title ?? '', M, y, { size: 80, weight: 700, color: p.text, max: maxW, maxLines: 2 });
      y += 70;
      const gap = tall ? 90 : 60;
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(M + 44, y + 44, 44, 0, Math.PI * 2);
        ctx.fillStyle = slide.theme === 'light' ? C.ink : '#ffffff';
        ctx.fill();
        ctx.fillStyle = slide.theme === 'light' ? '#ffffff' : C.ink;
        ctx.font = font(700, 44);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i), M + 44, y + 46);
        const end = text(ctx, f[`s${i}`] ?? '', M + 130, y + 14, { size: 46, weight: 600, color: p.text, max: maxW - 130, lh: 1.3, maxLines: 2 });
        if (i < 3) rr(ctx, M + 41, y + 100, 6, Math.max(20, end - y - 100 + gap - 12), 3, slide.theme === 'light' ? C.line : 'rgba(255,255,255,0.2)');
        y = Math.max(end, y + 88) + gap;
      }
      break;
    }
  }
  ctx.restore();
}

export async function ensureFonts() {
  try {
    await Promise.all([document.fonts.load(font(400, 40)), document.fonts.load(font(700, 40)), document.fonts.load(font(500, 40))]);
    await document.fonts.ready;
  } catch {
    /* 기본 글꼴로 그린다 */
  }
}

export async function slideToBlob(slide: Slide, format: PostFormat, lang: PostLang, page?: string): Promise<Blob> {
  await ensureFonts();
  const { w, h } = SIZES[format];
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  drawSlide(canvas.getContext('2d')!, slide, format, lang, page);
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('PNG 변환 실패'))), 'image/png'));
}

export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
