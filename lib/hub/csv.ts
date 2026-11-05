// 쉼표 CSV 읽기. 큰따옴표, 줄바꿈이 든 칸, 엑셀 BOM을 처리한다.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const s = text.replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === '"' && s[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      row.push(cell);
      cell = '';
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}

export const POST_COLUMNS = ['date', 'title', 'kind', 'hook', 'hook_type', 'topic', 'style', 'views', 'reach', 'likes', 'comments', 'saves', 'shares', 'follows', 'avg_watch_sec'] as const;
export const FOLLOWER_COLUMNS = ['date', 'followers'] as const;

export const POST_TEMPLATE = `${POST_COLUMNS.join(',')}\n2026-11-03,거리 인터뷰 1편,reel,지금 하는 일 10년 뒤에도 하고 싶으세요?,질문형,거리 인터뷰,노란 큰자막,120000,90000,4200,180,900,600,150,11.5\n`;
export const FOLLOWER_TEMPLATE = `${FOLLOWER_COLUMNS.join(',')}\n2026-11-03,18500\n2026-11-04,18580\n`;

export interface CsvResult<T> {
  rows: T[];
  errors: string[];
}

export function table(text: string, required: readonly string[]): { header: string[]; body: { line: number; get: (k: string) => string }[]; errors: string[] } {
  const rows = parseCsv(text);
  if (!rows.length) return { header: [], body: [], errors: ['CSV에 내용이 없어요.'] };
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const missing = required.filter((k) => !header.includes(k));
  if (missing.length) return { header, body: [], errors: [`첫 줄에 ${missing.join(', ')} 열이 필요해요.`] };
  return {
    header,
    errors: [],
    body: rows.slice(1).map((r, i) => ({
      line: i + 2,
      get: (k: string) => (r[header.indexOf(k)] ?? '').trim(),
    })),
  };
}

export function toInt(v: string): number | null {
  const n = Number(v.replace(/,/g, ''));
  return v !== '' && Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

export const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
