import 'server-only';
import { appendFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

// 수요 조사용 기록 저장소. DB 없이 JSON Lines 파일 두 개에 한 줄씩 덧붙인다.
// Railway에서는 Volume을 붙이고 DATA_DIR(예: /data)을 지정해야 재배포해도 남는다.

export const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
export const hasPersistentStorage = Boolean(process.env.DATA_DIR);

const EVENTS = path.join(DATA_DIR, 'events.jsonl');
const SIGNUPS = path.join(DATA_DIR, 'signups.jsonl');

export type EventType = 'visit' | 'cta' | 'modal_open' | 'signup';

export interface TrackEvent {
  at: string;
  type: EventType;
  vid: string;
  src: string;
  path: string;
  lang: string;
  cta?: string;
  ref?: string;
}

export interface Signup {
  at: string;
  email: string;
  role: 'buyer' | 'traveler' | 'both';
  from: string;
  to: string;
  item: string;
  pay: string;
  src: string;
  vid: string;
  lang: string;
}

async function append(file: string, row: object) {
  await mkdir(DATA_DIR, { recursive: true });
  await appendFile(file, JSON.stringify(row) + '\n', 'utf8');
}

async function readAll<T>(file: string): Promise<T[]> {
  try {
    const raw = await readFile(file, 'utf8');
    const out: T[] = [];
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;
      try {
        out.push(JSON.parse(line) as T);
      } catch {
        /* 깨진 줄은 건너뛴다 */
      }
    }
    return out;
  } catch {
    return [];
  }
}

export const addEvent = (e: TrackEvent) => append(EVENTS, e);
export const addSignup = (s: Signup) => append(SIGNUPS, s);
export const readEvents = () => readAll<TrackEvent>(EVENTS);

/** 같은 이메일로 여러 번 등록하면 마지막 등록만 남긴다. */
export async function readSignups() {
  const rows = await readAll<Signup>(SIGNUPS);
  const byEmail = new Map<string, Signup>();
  for (const r of rows) byEmail.set(r.email, r);
  return [...byEmail.values()].sort((a, b) => (a.at < b.at ? 1 : -1));
}

/** 입력값 정리: 문자열만, 길이 제한, 줄바꿈 제거 */
export function clean(v: unknown, max = 120) {
  return typeof v === 'string' ? v.replace(/[\r\n\t]+/g, ' ').trim().slice(0, max) : '';
}

const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|headless|lighthouse|curl|wget|python|axios/i;
export function isBot(ua: string | null) {
  return !ua || BOT_UA.test(ua);
}

// 한 IP가 짧은 시간에 너무 많이 보내면 무시한다 (서버 한 대 기준 메모리 제한).
const hits = new Map<string, { n: number; reset: number }>();
export function rateLimited(ip: string, limit = 60, windowMs = 60_000) {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || h.reset < now) {
    hits.set(ip, { n: 1, reset: now + windowMs });
    if (hits.size > 5000) hits.clear();
    return false;
  }
  h.n += 1;
  return h.n > limit;
}

export function clientIp(headers: Headers) {
  return headers.get('x-forwarded-for')?.split(',')[0].trim() || headers.get('x-real-ip') || 'unknown';
}
