// 자막 한 개를 캔버스에 그린다. 미리보기와 영상 출력이 같은 코드를 쓴다.
import type { SubtitleStyle } from './types';

export function fontString(s: SubtitleStyle, px: number) {
  return `${s.weight} ${px}px "${s.font}", "Noto Sans KR", sans-serif`;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(/(\s+)/)) {
      if (!word) continue;
      const test = line + word;
      if (ctx.measureText(test).width <= max || !line.trim()) {
        if (ctx.measureText(test).width > max) {
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

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

function hexAlpha(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** 그린 영역을 돌려준다. W×H는 영상 해상도. offset이 있으면 잘라 낸 캔버스에 그린다. */
export function drawCue(ctx: CanvasRenderingContext2D, text: string, s: SubtitleStyle, W: number, H: number, offset = { x: 0, y: 0 }, dryRun = false): Box {
  const k = W / 1080;
  const px = s.size * k;
  ctx.font = fontString(s, px);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'center';
  const lines = wrap(ctx, text, (W * s.maxWidthPct) / 100);
  const lh = px * s.lineHeight;
  const widest = Math.max(...lines.map((l) => ctx.measureText(l).width), 1);
  const blockH = lh * lines.length;
  const padX = s.boxOn ? px * 0.45 : 0;
  const padY = s.boxOn ? px * 0.25 : 0;
  const stroke = s.strokeWidth * k;
  const margin = Math.ceil(stroke + 4);
  // 끌어서 옮겨도 글자가 화면 밖으로 잘리지 않게 안쪽으로 맞춘다
  const inside = (v: number, half: number, size: number) => (half * 2 >= size ? size / 2 : Math.min(size - half, Math.max(half, v)));
  const cx = inside((W * s.xPct) / 100, widest / 2 + padX + margin, W);
  const cy = inside((H * s.yPct) / 100, blockH / 2 + padY + margin, H);
  const box: Box = {
    x: Math.floor(cx - widest / 2 - padX - margin),
    y: Math.floor(cy - blockH / 2 - padY - margin),
    w: Math.ceil(widest + padX * 2 + margin * 2),
    h: Math.ceil(blockH + padY * 2 + margin * 2),
  };
  if (dryRun) return box;

  const ox = cx - offset.x;
  const oy = cy - offset.y;
  if (s.boxOn) {
    ctx.fillStyle = hexAlpha(s.boxColor, s.boxOpacity);
    ctx.beginPath();
    ctx.roundRect(ox - widest / 2 - padX, oy - blockH / 2 - padY, widest + padX * 2, blockH + padY * 2, px * 0.2);
    ctx.fill();
  }
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  lines.forEach((line, i) => {
    const y = oy - blockH / 2 + lh * i + lh * 0.78;
    if (stroke > 0) {
      ctx.strokeStyle = s.strokeColor;
      ctx.lineWidth = stroke;
      ctx.strokeText(line, ox, y);
    }
    ctx.fillStyle = s.color;
    ctx.fillText(line, ox, y);
  });
  return box;
}

/** 영상에 얹을 PNG. 영상 밖으로 나가는 부분은 ffmpeg overlay가 잘라 낸다. */
export async function cueToPng(text: string, s: SubtitleStyle, W: number, H: number) {
  await document.fonts.load(fontString(s, 64), text);
  const probe = document.createElement('canvas').getContext('2d')!;
  const box = drawCue(probe, text, s, W, H, { x: 0, y: 0 }, true);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, box.w);
  canvas.height = Math.max(1, box.h);
  drawCue(canvas.getContext('2d')!, text, s, W, H, { x: box.x, y: box.y });
  const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('자막 이미지 변환 실패'))), 'image/png'));
  return { blob, x: box.x, y: box.y };
}
