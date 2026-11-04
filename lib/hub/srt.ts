import type { Cue } from './types';

function time(s: string) {
  const m = /(\d+):(\d{2}):(\d{2})[,.](\d{1,3})/.exec(s);
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(m[4].padEnd(3, '0')) / 1000 : null;
}

export function parseSrt(text: string): Cue[] {
  const out: Cue[] = [];
  for (const block of text.replace(/^﻿/, '').replace(/\r/g, '').split(/\n\s*\n/)) {
    const lines = block.split('\n').filter((l) => l.trim() !== '');
    const i = lines.findIndex((l) => l.includes('-->'));
    if (i < 0) continue;
    const [a, b] = lines[i].split('-->');
    const start = time(a);
    const end = time(b);
    const body = lines.slice(i + 1).join('\n').replace(/<[^>]+>/g, '').trim();
    if (start === null || end === null || end <= start || !body) continue;
    out.push({ start, end, text: body });
  }
  return out.sort((x, y) => x.start - y.start);
}

function stamp(t: number) {
  const ms = Math.round(t * 1000);
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
}

export function toSrt(cues: Cue[]) {
  return cues.map((c, i) => `${i + 1}\n${stamp(c.start)} --> ${stamp(c.end)}\n${c.text}\n`).join('\n');
}
