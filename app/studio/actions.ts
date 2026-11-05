'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { isAdmin } from '@/lib/admin';
import { aiReady, draftCues, suggestVariant } from '@/lib/hub/ai';
import { views } from '@/lib/hub/analytics';
import { FOLLOWER_COLUMNS, isDate, table, toInt } from '@/lib/hub/csv';
import { deleteMedia } from '@/lib/hub/media';
import { createReport, nextSlot, postDueItems } from '@/lib/hub/scheduler';
import { mutate, newId, readHub } from '@/lib/hub/store';
import { DEFAULT_STYLE, FONTS, addDays, todayKST, type Cue, type Metrics, type Post, type PostKind, type SubtitleStyle } from '@/lib/hub/types';

export type Result = { ok?: string; error?: string; id?: string } | null;

async function guard() {
  if (!(await isAdmin())) throw new Error('로그인이 필요해요.');
}

const done = (ok: string, extra?: { id?: string }): Result => {
  revalidatePath('/studio', 'layout');
  return { ok, ...extra };
};
const str = (f: FormData, k: string, max = 300) => String(f.get(k) ?? '').trim().slice(0, max);
const kindOf = (v: string): PostKind => (v === 'carousel' || v === 'image' ? v : 'reel');

export async function selectCreator(id: string) {
  await guard();
  (await cookies()).set('hub_creator', id, { path: '/', sameSite: 'lax', httpOnly: true, maxAge: 60 * 60 * 24 * 365 });
  revalidatePath('/studio', 'layout');
}

// ---------- 계정·인물 정보 ----------

export async function saveCreator(_: Result, f: FormData): Promise<Result> {
  await guard();
  const id = str(f, 'id');
  const name = str(f, 'name', 80);
  if (!name) return { error: '이름을 적어 주세요.' };
  const handle = str(f, 'handle', 60).replace(/^@/, '');
  const slots = [str(f, 'slot1'), str(f, 'slot2')].filter((s) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s));
  if (new Set(slots).size !== slots.length) return { error: '게시 시간 두 개가 같아요. 다르게 정해 주세요.' };
  const newCreatorId = newId();
  await mutate((hub) => {
    const c = hub.creators.find((x) => x.id === id);
    if (c) Object.assign(c, { name, handle, voice: str(f, 'voice', 600), note: str(f, 'note', 600), slots: slots.length ? slots : c.slots });
    else hub.creators.push({ id: newCreatorId, name, handle, voice: str(f, 'voice', 600), note: str(f, 'note', 600), career: [], quotes: [], slots: slots.length ? slots : ['10:00', '20:00'], reportStart: todayKST(), createdAt: new Date().toISOString() });
  });
  if (!id) (await cookies()).set('hub_creator', newCreatorId, { path: '/', sameSite: 'lax', httpOnly: true, maxAge: 60 * 60 * 24 * 365 });
  return done(id ? '저장했어요.' : `${name} 계정을 추가했어요.`);
}

export async function addEntry(_: Result, f: FormData): Promise<Result> {
  await guard();
  const creatorId = str(f, 'creatorId');
  const kind = str(f, 'kind') === 'quote' ? 'quotes' : 'career';
  const text = str(f, 'text', 500);
  if (!text) return { error: '내용을 적어 주세요.' };
  await mutate((hub) => {
    hub.creators.find((c) => c.id === creatorId)?.[kind].push({ id: newId(), label: str(f, 'label', 80), text, addedAt: todayKST() });
  });
  return done('추가했어요.');
}

export async function removeEntry(creatorId: string, kind: 'career' | 'quotes', id: string) {
  await guard();
  await mutate((hub) => {
    const c = hub.creators.find((x) => x.id === creatorId);
    if (c) c[kind] = c[kind].filter((e) => e.id !== id);
  });
  revalidatePath('/studio', 'layout');
}

export async function removeSample() {
  await guard();
  await mutate((hub) => {
    const ids = new Set(hub.creators.filter((c) => c.sample).map((c) => c.id));
    hub.creators = hub.creators.filter((c) => !ids.has(c.id));
    hub.posts = hub.posts.filter((p) => !ids.has(p.creatorId));
    hub.followers = hub.followers.filter((p) => !ids.has(p.creatorId));
    hub.queue = hub.queue.filter((p) => !ids.has(p.creatorId));
    hub.projects = hub.projects.filter((p) => !ids.has(p.creatorId));
    hub.reports = hub.reports.filter((p) => !ids.has(p.creatorId));
    hub.sampleRemoved = true;
  });
  revalidatePath('/studio', 'layout');
}

// ---------- 게시물·수치 입력 ----------

function metricsFrom(get: (k: string) => string, at: string): Metrics | null {
  const v = get('views');
  if (v === '') return null;
  const n = toInt(v);
  if (n === null) return null;
  const num = (k: string) => toInt(get(k)) ?? 0;
  const watch = Number(get('avg_watch_sec'));
  return { at, views: n, reach: num('reach'), likes: num('likes'), comments: num('comments'), saves: num('saves'), shares: num('shares'), follows: num('follows'), ...(get('avg_watch_sec') !== '' && Number.isFinite(watch) && watch >= 0 ? { avgWatchSec: watch } : {}) };
}

export async function addPost(_: Result, f: FormData): Promise<Result> {
  await guard();
  const date = str(f, 'date');
  const title = str(f, 'title', 120);
  if (!isDate(date)) return { error: '게시일을 골라 주세요.' };
  if (!title) return { error: '제목을 적어 주세요.' };
  const metric = metricsFrom((k) => str(f, k), todayKST());
  await mutate((hub) => {
    hub.posts.push({ id: newId(), creatorId: str(f, 'creatorId'), date, title, kind: kindOf(str(f, 'kind')), hook: str(f, 'hook', 200), hookType: str(f, 'hook_type', 40), topic: str(f, 'topic', 40), style: str(f, 'style', 40), caption: str(f, 'caption', 2200), source: 'manual', metrics: metric ? [metric] : [] });
  });
  return done('게시물을 보관함에 넣었어요.');
}

export async function updateMetrics(_: Result, f: FormData): Promise<Result> {
  await guard();
  const metric = metricsFrom((k) => str(f, k), todayKST());
  if (!metric) return { error: '조회수를 숫자로 적어 주세요.' };
  const found = await mutate((hub) => {
    const p = hub.posts.find((x) => x.id === str(f, 'id'));
    if (!p) return false;
    p.metrics = [...p.metrics.filter((m) => m.at !== metric.at), metric];
    return true;
  });
  return found ? done('수치를 저장했어요.') : { error: '게시물을 찾지 못했어요.' };
}

export async function deletePost(id: string) {
  await guard();
  await mutate((hub) => {
    hub.posts = hub.posts.filter((p) => p.id !== id);
    hub.queue = hub.queue.filter((q) => q.sourcePostId !== id || q.status === 'posted');
  });
  revalidatePath('/studio', 'layout');
}

export async function addFollowers(_: Result, f: FormData): Promise<Result> {
  await guard();
  const date = str(f, 'date');
  const n = toInt(str(f, 'followers'));
  if (!isDate(date) || n === null) return { error: '날짜와 팔로워 수를 확인해 주세요.' };
  await mutate((hub) => {
    const creatorId = str(f, 'creatorId');
    hub.followers = [...hub.followers.filter((p) => !(p.creatorId === creatorId && p.date === date)), { creatorId, date, followers: n }];
  });
  return done('팔로워 수를 저장했어요.');
}

export async function importPosts(_: Result, f: FormData): Promise<Result> {
  await guard();
  const text = str(f, 'csv', 2_000_000);
  const creatorId = str(f, 'creatorId');
  const t = table(text, ['date', 'title', 'views']);
  if (t.errors.length) return { error: t.errors[0] };
  const errors: string[] = [];
  const rows: Post[] = [];
  for (const r of t.body) {
    if (!isDate(r.get('date'))) errors.push(`${r.line}행 날짜`);
    else if (!r.get('title')) errors.push(`${r.line}행 제목`);
    else {
      const metric = metricsFrom(r.get, todayKST());
      if (r.get('views') !== '' && !metric) {
        errors.push(`${r.line}행 조회수`);
        continue;
      }
      rows.push({ id: newId(), creatorId, date: r.get('date'), title: r.get('title').slice(0, 120), kind: kindOf(r.get('kind')), hook: r.get('hook').slice(0, 200), hookType: r.get('hook_type').slice(0, 40), topic: r.get('topic').slice(0, 40), style: r.get('style').slice(0, 40), caption: '', source: 'csv', metrics: metric ? [metric] : [] });
    }
  }
  if (errors.length) return { error: `아무것도 저장하지 않았어요. ${errors.slice(0, 8).join(', ')}를 확인해 주세요.` };
  if (!rows.length) return { error: '저장할 줄이 없어요.' };
  const { added, updated } = await mutate((hub) => {
    let a = 0;
    let u = 0;
    for (const row of rows) {
      const old = hub.posts.find((p) => p.creatorId === creatorId && p.date === row.date && p.title === row.title);
      if (old) {
        const m = row.metrics[0];
        if (m) old.metrics = [...old.metrics.filter((x) => x.at !== m.at), m];
        u++;
      } else {
        hub.posts.push(row);
        a++;
      }
    }
    return { added: a, updated: u };
  });
  return done(`새 게시물 ${added}개, 수치 갱신 ${updated}개를 저장했어요.`);
}

export async function importFollowers(_: Result, f: FormData): Promise<Result> {
  await guard();
  const creatorId = str(f, 'creatorId');
  const t = table(str(f, 'csv', 2_000_000), FOLLOWER_COLUMNS);
  if (t.errors.length) return { error: t.errors[0] };
  const errors: string[] = [];
  const rows: { date: string; followers: number }[] = [];
  for (const r of t.body) {
    const n = toInt(r.get('followers'));
    if (!isDate(r.get('date')) || n === null) errors.push(`${r.line}행`);
    else rows.push({ date: r.get('date'), followers: n });
  }
  if (errors.length) return { error: `아무것도 저장하지 않았어요. ${errors.slice(0, 8).join(', ')}를 확인해 주세요.` };
  if (!rows.length) return { error: '저장할 줄이 없어요.' };
  await mutate((hub) => {
    const dates = new Set(rows.map((r) => r.date));
    hub.followers = [...hub.followers.filter((p) => !(p.creatorId === creatorId && dates.has(p.date))), ...rows.map((r) => ({ creatorId, ...r }))];
  });
  return done(`팔로워 기록 ${rows.length}일치를 저장했어요.`);
}

export async function recordCardPost(creatorId: string, title: string, style: string, topic: string): Promise<Result> {
  await guard();
  await mutate((hub) => {
    hub.posts.push({ id: newId(), creatorId, date: todayKST(), title: title.slice(0, 120), kind: 'carousel', hook: title.slice(0, 200), hookType: '', topic: topic.slice(0, 40), style: style.slice(0, 40), caption: '', source: 'card', metrics: [] });
  });
  return done('보관함에 기록했어요.');
}

// ---------- 트라이얼 ----------

export async function createVariant(sourcePostId: string): Promise<Result> {
  await guard();
  const hub = await readHub();
  const post = hub.posts.find((p) => p.id === sourcePostId);
  const creator = hub.creators.find((c) => c.id === post?.creatorId);
  if (!post || !creator) return { error: '게시물을 찾지 못했어요.' };
  if (post.kind !== 'reel') return { error: '트라이얼은 릴스만 올릴 수 있어요.' };
  let hookOptions: string[] = [];
  let caption = post.caption;
  let note: string | undefined;
  if (aiReady()) {
    try {
      const winners = hub.posts.filter((p) => p.creatorId === creator.id && p.id !== post.id && p.hook).sort((a, b) => views(b) - views(a)).slice(0, 5).map((p) => p.hook);
      const s = await suggestVariant(post, creator, winners);
      hookOptions = s.hooks.slice(0, 3);
      caption = s.caption;
    } catch (e) {
      console.error('variant suggestion failed', e);
      note = 'AI 제안을 받지 못해 직접 쓰도록 만들었어요.';
    }
  } else note = 'OPENAI_API_KEY가 없어서 첫 문장을 직접 써야 해요.';
  const id = newId();
  await mutate((h) => {
    h.queue.push({ id, creatorId: creator.id, sourcePostId, hook: hookOptions[0] ?? '', hookOptions, caption, changeNote: '', status: 'draft', mode: 'test', createdAt: new Date().toISOString() });
  });
  return done(note ?? '변형본 초안을 만들었어요.', { id });
}

export async function saveVariant(_: Result, f: FormData): Promise<Result> {
  await guard();
  const id = str(f, 'id');
  const hook = str(f, 'hook', 200);
  const changeNote = str(f, 'changeNote', 300);
  const caption = str(f, 'caption', 2200);
  const renderId = str(f, 'renderId') || undefined;
  const approve = str(f, 'intent') === 'approve';
  const hub = await readHub();
  const q = hub.queue.find((x) => x.id === id);
  if (!q) return { error: '변형본을 찾지 못했어요.' };
  if (q.status !== 'draft') return { error: '이미 승인한 변형본이에요. 승인을 취소한 뒤 고쳐 주세요.' };
  if (approve) {
    const src = hub.posts.find((p) => p.id === q.sourcePostId);
    if (!hook) return { error: '첫 문장을 적어 주세요.' };
    if (src && hook === src.hook && !renderId) return { error: '원본과 같은 영상과 첫 문장이에요. 첫 문장이나 영상을 바꿔 주세요.' };
    if (!changeNote) return { error: '원본과 무엇이 다른지 적어 주세요. 보고서에서 비교할 때 써요.' };
  }
  const creator = hub.creators.find((c) => c.id === q.creatorId);
  await mutate((h) => {
    const item = h.queue.find((x) => x.id === id);
    if (!item) return;
    Object.assign(item, { hook, changeNote, caption, renderId });
    if (approve && creator) {
      item.status = 'scheduled';
      item.approvedAt = new Date().toISOString();
      item.scheduledAt = nextSlot(creator, h.queue);
    }
  });
  return done(approve ? '승인했어요. 다음 빈 시간에 테스트 게시돼요.' : '초안을 저장했어요.');
}

export async function unapproveVariant(id: string) {
  await guard();
  await mutate((hub) => {
    const q = hub.queue.find((x) => x.id === id);
    if (q?.status === 'scheduled') {
      q.status = 'draft';
      q.scheduledAt = undefined;
      q.approvedAt = undefined;
    }
  });
  revalidatePath('/studio', 'layout');
}

export async function deleteVariant(id: string) {
  await guard();
  await mutate((hub) => {
    hub.queue = hub.queue.filter((q) => q.id !== id || q.status === 'posted');
  });
  revalidatePath('/studio', 'layout');
}

export async function runDueNow(): Promise<Result> {
  await guard();
  const n = await postDueItems();
  return done(n ? `${n}개를 테스트 게시로 기록했어요.` : '지금 게시할 차례인 항목이 없어요.');
}

// ---------- 보고서 ----------

export async function generateReport(creatorId: string): Promise<Result> {
  await guard();
  try {
    const r = await createReport(creatorId, false);
    return done('보고서를 만들었어요.', { id: r.id });
  } catch (e) {
    return { error: e instanceof Error ? e.message : '보고서를 만들지 못했어요.' };
  }
}

export async function deleteReport(id: string) {
  await guard();
  await mutate((hub) => {
    hub.reports = hub.reports.filter((r) => r.id !== id);
  });
  revalidatePath('/studio', 'layout');
}

// ---------- 자막 프로젝트 ----------

export async function createProject(input: { creatorId: string; title: string; videoId: string; videoBytes: number; width: number; height: number; duration: number }): Promise<Result> {
  await guard();
  if (!/^[a-f0-9]{16}$/.test(input.videoId)) return { error: '영상을 찾지 못했어요.' };
  const id = newId();
  await mutate((hub) => {
    hub.projects.unshift({ id, creatorId: input.creatorId, title: input.title.slice(0, 120) || '새 영상', videoId: input.videoId, videoBytes: input.videoBytes, width: Math.round(input.width), height: Math.round(input.height), duration: input.duration, cues: [], style: { ...DEFAULT_STYLE }, styleName: '', renders: [], updatedAt: new Date().toISOString() });
  });
  return done('영상을 올렸어요.', { id });
}

function cleanStyle(s: SubtitleStyle): SubtitleStyle {
  const hex = (v: unknown, d: string) => (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v : d);
  const n = (v: unknown, lo: number, hi: number, d: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
  const font = FONTS.find((x) => x.family === s.font) ?? FONTS[0];
  return {
    font: font.family,
    weight: font.weights.includes(s.weight) ? s.weight : font.weights[font.weights.length - 1],
    size: n(s.size, 24, 200, DEFAULT_STYLE.size),
    color: hex(s.color, DEFAULT_STYLE.color),
    strokeColor: hex(s.strokeColor, DEFAULT_STYLE.strokeColor),
    strokeWidth: n(s.strokeWidth, 0, 30, DEFAULT_STYLE.strokeWidth),
    boxOn: Boolean(s.boxOn),
    boxColor: hex(s.boxColor, DEFAULT_STYLE.boxColor),
    boxOpacity: n(s.boxOpacity, 0, 1, DEFAULT_STYLE.boxOpacity),
    xPct: n(s.xPct, 0, 100, 50),
    yPct: n(s.yPct, 0, 100, 72),
    maxWidthPct: n(s.maxWidthPct, 30, 100, 84),
    lineHeight: n(s.lineHeight, 1, 2, 1.3),
  };
}

function cleanCues(cues: Cue[]): Cue[] {
  return cues
    .filter((c) => Number.isFinite(c.start) && Number.isFinite(c.end))
    .slice(0, 400)
    .map((c) => ({ start: Math.max(0, c.start), end: Math.max(c.start + 0.1, c.end), text: String(c.text).slice(0, 300) }));
}

export async function saveProject(id: string, input: { title: string; cues: Cue[]; style: SubtitleStyle; styleName: string }): Promise<Result> {
  await guard();
  const found = await mutate((hub) => {
    const p = hub.projects.find((x) => x.id === id);
    if (!p) return false;
    p.title = String(input.title).slice(0, 120) || p.title;
    p.cues = cleanCues(input.cues);
    p.style = cleanStyle(input.style);
    p.styleName = String(input.styleName).slice(0, 40);
    p.updatedAt = new Date().toISOString();
    return true;
  });
  return found ? { ok: '저장했어요.' } : { error: '프로젝트를 찾지 못했어요.' };
}

export async function aiDraftCues(id: string): Promise<{ cues?: Cue[]; error?: string }> {
  await guard();
  const hub = await readHub();
  const p = hub.projects.find((x) => x.id === id);
  const creator = hub.creators.find((c) => c.id === p?.creatorId);
  if (!p || !creator) return { error: '프로젝트를 찾지 못했어요.' };
  try {
    return { cues: await draftCues(p.videoId, creator) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : '자막 초안을 만들지 못했어요.' };
  }
}

export async function deleteProject(id: string) {
  await guard();
  const media = await mutate((hub) => {
    const p = hub.projects.find((x) => x.id === id);
    if (!p) return [];
    hub.projects = hub.projects.filter((x) => x.id !== id);
    const rids = new Set(p.renders.map((r) => r.id));
    for (const q of hub.queue) if (q.renderId && rids.has(q.renderId) && q.status === 'draft') q.renderId = undefined;
    return [p.videoId, ...p.renders.map((r) => r.mediaId)];
  });
  await Promise.all(media.map(deleteMedia));
  revalidatePath('/studio', 'layout');
}

export async function deleteLead(id: string) {
  await guard();
  await mutate((hub) => {
    hub.leads = hub.leads.filter((l) => l.id !== id);
  });
  revalidatePath('/studio', 'layout');
}

// ---------- 보고서 시작일 ----------

export async function setReportStart(creatorId: string, date: string): Promise<Result> {
  await guard();
  if (!isDate(date)) return { error: '날짜를 확인해 주세요.' };
  await mutate((hub) => {
    const c = hub.creators.find((x) => x.id === creatorId);
    if (c) c.reportStart = date;
  });
  return done(`다음 보고서는 ${date} ~ ${addDays(date, 13)} 기간으로 만들어요.`);
}

