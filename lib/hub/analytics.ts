// 툴에 쌓인 데이터만으로 계산한다. 서버와 브라우저에서 같이 쓴다.
import { addDays, todayKST, type FollowerPoint, type GroupRow, type Metrics, type Post, type QueueItem, type ReportNumbers } from './types';

export const latest = (p: Post): Metrics | null => p.metrics[p.metrics.length - 1] ?? null;
export const measured = (posts: Post[]) => posts.filter((p) => latest(p));

export function median(values: number[]) {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

const interactions = (m: Metrics) => m.likes + m.comments + m.saves + m.shares;

/** 도달 대비 반응 비율. 도달이 없으면 조회수를 기준으로 쓴다. */
export function engagementRate(posts: Post[]): number | null {
  let top = 0;
  let bottom = 0;
  for (const p of posts) {
    const m = latest(p);
    if (!m) continue;
    top += interactions(m);
    bottom += m.reach || m.views;
  }
  return bottom > 0 ? top / bottom : null;
}

export const views = (p: Post) => latest(p)?.views ?? 0;

/** 터진 게시물: 이 계정 게시물 중앙값의 2배 이상 조회수 */
export const BREAKOUT_MULTIPLE = 2;

export function withMultiple(posts: Post[], base: number) {
  return measured(posts)
    .map((p) => ({ post: p, multiple: base > 0 ? views(p) / base : 0 }))
    .sort((a, b) => views(b.post) - views(a.post));
}

export function inPeriod(posts: Post[], from: string, to: string) {
  return posts.filter((p) => p.date >= from && p.date <= to);
}

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];
export const weekdayOf = (date: string) => WEEKDAY[new Date(`${date}T00:00:00Z`).getUTCDay()];

export function groupBy(posts: Post[], key: (p: Post) => string): GroupRow[] {
  const m = new Map<string, Post[]>();
  for (const p of measured(posts)) {
    const k = key(p).trim();
    if (!k) continue;
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(p);
  }
  return [...m.entries()]
    .map(([k, list]) => ({ key: k, count: list.length, medianViews: median(list.map(views)), engagementRate: engagementRate(list) }))
    .sort((a, b) => b.medianViews - a.medianViews);
}

export function followerRange(points: FollowerPoint[], from: string, to: string) {
  const list = points.filter((p) => p.date >= from && p.date <= to).sort((a, b) => (a.date < b.date ? -1 : 1));
  if (!list.length) return { start: null, end: null, delta: null, list };
  const start = list[0].followers;
  const end = list[list.length - 1].followers;
  return { start, end, delta: list.length > 1 ? end - start : null, list };
}

/** 월요일 시작 주별 조회수. 조회수는 게시일 기준으로 묶는다. */
export function weekly(posts: Post[], from: string, to: string) {
  const start = new Date(`${from}T00:00:00Z`);
  const back = (start.getUTCDay() + 6) % 7;
  let cur = addDays(from, -back);
  const out: { week: string; views: number; posts: number }[] = [];
  while (cur <= to) {
    const end = addDays(cur, 6);
    const list = measured(posts).filter((p) => p.date >= cur && p.date <= end && p.date >= from && p.date <= to);
    out.push({ week: cur, views: list.reduce((a, p) => a + views(p), 0), posts: list.length });
    cur = addDays(cur, 7);
  }
  return out;
}

export const GROUPINGS: { name: string; key: (p: Post) => string }[] = [
  { name: '첫 문장 유형', key: (p) => p.hookType },
  { name: '주제', key: (p) => p.topic },
  { name: '자막·카드 스타일', key: (p) => p.style },
  { name: '요일', key: (p) => weekdayOf(p.date) },
];

/** 2주 보고서의 숫자. AI를 거치지 않고 코드로만 계산한다. */
export function computeNumbers(posts: Post[], followers: FollowerPoint[], queue: QueueItem[], from: string, to: string): ReportNumbers {
  const days = Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1;
  const prevTo = addDays(from, -1);
  const prevFrom = addDays(from, -days);
  const cur = inPeriod(posts, from, to);
  const prev = inPeriod(posts, prevFrom, prevTo);
  const m = measured(cur);
  const base = median(measured(posts.filter((p) => p.date <= to)).map(views));
  const f = followerRange(followers, from, to);
  const pf = followerRange(followers, prevFrom, prevTo);
  return {
    posts: cur.length,
    measuredPosts: m.length,
    followersStart: f.start,
    followersEnd: f.end,
    followerDelta: f.delta,
    views: m.reduce((a, p) => a + views(p), 0),
    medianViews: median(m.map(views)),
    engagementRate: engagementRate(m),
    saves: m.reduce((a, p) => a + (latest(p)?.saves ?? 0), 0),
    shares: m.reduce((a, p) => a + (latest(p)?.shares ?? 0), 0),
    prevViews: measured(prev).reduce((a, p) => a + views(p), 0),
    prevMeasuredPosts: measured(prev).length,
    prevFollowerDelta: pf.delta,
    breakouts: withMultiple(m, base)
      .filter((x) => x.multiple >= BREAKOUT_MULTIPLE)
      .slice(0, 5)
      .map((x) => ({ id: x.post.id, title: x.post.title, views: views(x.post), multiple: Math.round(x.multiple * 10) / 10 })),
    groups: GROUPINGS.map((g) => ({ name: g.name, rows: groupBy(m, g.key).slice(0, 6) })),
    trialsPosted: queue.filter((q) => {
      if (q.status !== 'posted' || !q.postedAt) return false;
      const day = todayKST(new Date(q.postedAt));
      return day >= from && day <= to;
    }).length,
  };
}

/** 트라이얼 후보: 그 달의 릴스 중 조회수 상위. 트라이얼은 릴스만 가능하다. */
export function trialCandidates(posts: Post[], month: string, limit = 10) {
  const reels = measured(posts).filter((p) => p.kind === 'reel' && !p.trial && p.date.startsWith(month));
  const base = median(reels.map(views));
  return withMultiple(reels, base).slice(0, limit);
}
