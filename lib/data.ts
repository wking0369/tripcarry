import 'server-only';
import { appendFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

// 수요 조사용 기록 저장소. DB 없이 JSON Lines 파일 두 개에 한 줄씩 덧붙인다.
// Railway에서는 Volume을 붙여야 재배포해도 남는다. Volume을 붙이면 Railway가
// RAILWAY_VOLUME_MOUNT_PATH를 자동으로 넣어 주므로, 그 값으로 실제 연결 여부를 판단한다.

const VOLUME = process.env.RAILWAY_VOLUME_MOUNT_PATH || '';
const ON_RAILWAY = Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_ENVIRONMENT_NAME || process.env.RAILWAY_PROJECT_ID);
const WANTED = process.env.DATA_DIR || '';

function inside(child: string, parent: string) {
  const rel = path.relative(path.resolve(parent), path.resolve(child));
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

/** Volume이 있으면 반드시 그 안에 저장한다 (DATA_DIR이 Volume 밖을 가리키면 Volume 경로를 쓴다). */
export const DATA_DIR = VOLUME ? (WANTED && inside(WANTED, VOLUME) ? WANTED : VOLUME) : WANTED || path.join(process.cwd(), 'data');

export const storage = (() => {
  if (VOLUME) {
    const note = WANTED && !inside(WANTED, VOLUME) ? `DATA_DIR(${WANTED})이 Volume 경로(${VOLUME}) 밖이라 Volume 경로에 저장하고 있어요.` : '';
    return { persistent: true, message: note };
  }
  if (ON_RAILWAY) {
    return { persistent: false, message: 'Railway에 Volume이 연결되지 않았어요. 지금 기록은 새로 배포할 때마다 지워져요.' };
  }
  return WANTED
    ? { persistent: true, message: '' }
    : { persistent: false, message: '저장 위치(DATA_DIR)가 설정되지 않아 임시 폴더에 저장하고 있어요.' };
})();

/** 하위 호환 */
export const hasPersistentStorage = storage.persistent;

/** 지금 떠 있는 배포의 커밋 (Railway가 넣어 주는 값) */
export const DEPLOY_VERSION = (process.env.RAILWAY_GIT_COMMIT_SHA || '').slice(0, 7) || 'local';

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
