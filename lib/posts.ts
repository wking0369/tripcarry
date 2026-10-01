import 'server-only';
import { randomBytes } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DATA_DIR, readEvents, readSignups } from './data';
import { ASSET_ID, TEMPLATES, srcFor, type Post, type PostStats, type Slide } from './studio';

// 마케팅 스튜디오 게시물 저장. 게시물 수가 적어서 JSON 파일 하나로 충분하다.
const FILE = path.join(DATA_DIR, 'posts.json');

export async function readPosts(): Promise<Post[]> {
  try {
    const list = JSON.parse(await readFile(FILE, 'utf8')) as Post[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function writePosts(list: Post[]) {
  await mkdir(DATA_DIR, { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(list, null, 1), 'utf8');
  await rename(tmp, FILE);
}

// 같은 서버 안에서 동시에 저장해도 꼬이지 않게 순서대로 처리
let chain: Promise<unknown> = Promise.resolve();
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn, fn);
  chain = next.catch(() => {});
  return next;
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');
const pick = <T extends string>(v: unknown, ok: readonly T[], d: T): T => (ok.includes(v as T) ? (v as T) : d);
const TEMPLATE_IDS = TEMPLATES.map((t) => t.id);

function cleanSlides(v: unknown): Slide[] {
  if (!Array.isArray(v)) return [];
  return v.slice(0, 10).map((s) => {
    const fields: Record<string, string> = {};
    if (s && typeof s.fields === 'object') {
      for (const [k, val] of Object.entries(s.fields as Record<string, unknown>).slice(0, 20)) fields[k.slice(0, 20)] = str(val, 400);
    }
    const image = typeof s?.image === 'string' && ASSET_ID.test(s.image) ? s.image : undefined;
    return { template: pick(s?.template, TEMPLATE_IDS, 'hook'), theme: pick(s?.theme, ['light', 'green', 'dark'] as const, 'light'), fields, ...(image ? { image } : {}) };
  });
}

function clean(input: Record<string, unknown>, base: Post): Post {
  return {
    ...base,
    date: /^\d{4}-\d{2}-\d{2}$/.test(String(input.date)) ? String(input.date) : base.date,
    title: str(input.title ?? base.title, 120),
    format: pick(input.format, ['feed', 'story'] as const, base.format),
    lang: pick(input.lang, ['ko', 'en'] as const, base.lang),
    status: pick(input.status, ['draft', 'ready', 'posted'] as const, base.status),
    goal: pick(input.goal, ['buyer', 'price', 'route', 'traveler', 'trust'] as const, base.goal),
    slides: input.slides === undefined ? base.slides : cleanSlides(input.slides),
    photos: Array.isArray(input.photos) ? input.photos.filter((x): x is string => typeof x === 'string' && ASSET_ID.test(x)).slice(0, 10) : base.photos ?? [],
    caption: str(input.caption ?? base.caption, 2200),
    hashtags: str(input.hashtags ?? base.hashtags, 600),
    updatedAt: new Date().toISOString(),
  };
}

export function createPost(input: Record<string, unknown>) {
  return serial(async () => {
    const list = await readPosts();
    const now = new Date().toISOString();
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(input.date)) ? String(input.date) : now.slice(0, 10);
    const base: Post = {
      id: randomBytes(6).toString('hex'),
      slug: `${date.slice(5).replace('-', '')}_${randomBytes(2).toString('hex')}`,
      date,
      title: '',
      format: 'feed',
      lang: 'ko',
      status: 'draft',
      goal: 'buyer',
      slides: [],
      photos: [],
      caption: '',
      hashtags: '',
      createdAt: now,
      updatedAt: now,
    };
    const post = clean(input, base);
    await writePosts([...list, post]);
    return post;
  });
}

export function updatePost(id: string, input: Record<string, unknown>) {
  return serial(async () => {
    const list = await readPosts();
    const i = list.findIndex((p) => p.id === id);
    if (i < 0) return null;
    list[i] = clean(input, list[i]);
    await writePosts(list);
    return list[i];
  });
}

export function deletePost(id: string) {
  return serial(async () => {
    const list = await readPosts();
    const next = list.filter((p) => p.id !== id);
    if (next.length === list.length) return false;
    await writePosts(next);
    return true;
  });
}

/** 게시물마다 추적 링크(?src=ig_<slug>)로 들어온 방문·클릭·등록 수 */
export async function postStats(posts: Post[]): Promise<Record<string, PostStats>> {
  const [events, signups] = await Promise.all([readEvents(), readSignups()]);
  const want = new Map(posts.map((p) => [srcFor(p.slug), p.id]));
  const v = new Map<string, Set<string>>();
  const c = new Map<string, Set<string>>();
  for (const e of events) {
    const id = want.get(e.src);
    if (!id) continue;
    const m = e.type === 'visit' ? v : e.type === 'cta' ? c : null;
    if (!m) continue;
    if (!m.has(id)) m.set(id, new Set());
    m.get(id)!.add(e.vid);
  }
  const out: Record<string, PostStats> = {};
  for (const p of posts) out[p.id] = { visitors: v.get(p.id)?.size ?? 0, clicks: c.get(p.id)?.size ?? 0, signups: 0 };
  for (const s of signups) {
    const id = want.get(s.src);
    if (id) out[id].signups += 1;
  }
  return out;
}
