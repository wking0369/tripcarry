import 'server-only';
import { computeNumbers } from './analytics';
import { AI, AiSetupError, aiReady, writeNarrative } from './ai';
import { mutate, newId, readHub } from './store';
import { addDays, todayKST, type Creator, type Hub, type QueueItem, type Report, type ReportNarrative, type ReportNumbers } from './types';

const REPORT_DAYS = 14;
export const MAX_PER_DAY = 2;

export const slotIso = (date: string, time: string) => `${date}T${time}:00+09:00`;

/** 승인한 변형본이 들어갈 다음 빈 시간. 하루 최대 2개. */
export function nextSlot(creator: Creator, queue: QueueItem[], now = new Date()) {
  const taken = new Set(queue.filter((q) => q.creatorId === creator.id && q.scheduledAt && q.status !== 'draft').map((q) => new Date(q.scheduledAt!).getTime()));
  const slots = [...creator.slots].sort().slice(0, MAX_PER_DAY);
  for (let d = 0; d < 400; d++) {
    const date = addDays(todayKST(now), d);
    for (const time of slots) {
      const at = new Date(slotIso(date, time));
      if (at > now && !taken.has(at.getTime())) return at.toISOString();
    }
  }
  throw new Error('다음 게시 시간을 찾지 못했어요.');
}

// ---------- 테스트 게시 ----------

/**
 * 시간이 된 변형본을 처리한다. 인스타를 연결하기 전이라 실제로 올리지 않고 "테스트 게시"로만 기록한다.
 * 실제 게시를 붙일 때는 이 함수의 표시 부분을 인스타 API 호출로 바꾸면 된다.
 */
export function postDueItems(now = new Date()) {
  return mutate((hub) => {
    let n = 0;
    for (const q of hub.queue) {
      if (q.status !== 'scheduled' || !q.scheduledAt || new Date(q.scheduledAt) > now) continue;
      const src = hub.posts.find((p) => p.id === q.sourcePostId);
      q.status = 'posted';
      q.postedAt = q.scheduledAt;
      hub.posts.push({
        id: newId(),
        creatorId: q.creatorId,
        date: todayKST(new Date(q.scheduledAt)),
        title: `[테스트 트라이얼] ${q.hook}`.slice(0, 120),
        kind: 'reel',
        hook: q.hook,
        hookType: src?.hookType ?? '',
        topic: src?.topic ?? '',
        style: src?.style ?? '',
        caption: q.caption,
        source: 'trial',
        parentId: q.sourcePostId,
        trial: true,
        metrics: [],
      });
      n++;
    }
    return n;
  });
}

// ---------- 2주 보고서 ----------

export function nextPeriod(creator: Creator, hub: Hub) {
  const done = hub.reports.filter((r) => r.creatorId === creator.id && !r.interim).map((r) => r.periodEnd).sort();
  const start = done.length ? addDays(done[done.length - 1], 1) : creator.reportStart;
  return { start, end: addDays(start, REPORT_DAYS - 1) };
}

/** 표본이 적으면 단정하지 않고, 숫자에서 바로 나오는 사실만 적는다. AI가 없을 때 쓴다. */
export function rulesNarrative(n: ReportNumbers, interim = false): ReportNarrative {
  const period = interim ? '이번 기간 지금까지' : '이번 2주에';
  const worked: string[] = [];
  const didnt: string[] = [];
  const style: string[] = [];
  for (const b of n.breakouts.slice(0, 3)) worked.push(`"${b.title}"이 평소의 ${b.multiple}배인 조회수 ${b.views.toLocaleString('ko-KR')}회를 기록했어.`);
  for (const g of n.groups) {
    const rows = g.rows.filter((r) => r.count >= 3);
    if (rows.length < 2) continue;
    const top = rows[0];
    const low = rows[rows.length - 1];
    if (top.medianViews <= low.medianViews) continue;
    style.push(`${g.name}: "${top.key}"(게시물 ${top.count}개, 중앙값 ${top.medianViews.toLocaleString('ko-KR')}회)가 "${low.key}"(${low.count}개, ${low.medianViews.toLocaleString('ko-KR')}회)보다 높았어.`);
    didnt.push(`${g.name} 중 "${low.key}"이 가장 낮았어 (게시물 ${low.count}개, 중앙값 ${low.medianViews.toLocaleString('ko-KR')}회).`);
  }
  const change = n.prevViews > 0 ? Math.round(((n.views - n.prevViews) / n.prevViews) * 100) : null;
  const summary = n.measuredPosts
    ? `${period} 수치가 입력된 게시물은 ${n.measuredPosts}개이고 총 조회수는 ${n.views.toLocaleString('ko-KR')}회야.${change === null ? '' : ` 직전 같은 기간보다 ${change >= 0 ? `${change}% 늘었어` : `${-change}% 줄었어`}.`}${n.followerDelta === null ? ' 팔로워 기록은 부족해.' : ` 팔로워는 ${n.followerDelta >= 0 ? '+' : ''}${n.followerDelta.toLocaleString('ko-KR')}명 변했어.`}`
    : `${period} 수치가 입력된 게시물이 없어서 판단할 수 없어.`;
  return {
    summary,
    worked: worked.length ? worked : ['평소의 2배를 넘긴 게시물은 없었어.'],
    didnt: didnt.length ? didnt : ['비교할 만큼 게시물이 쌓인 묶음이 아직 없어.'],
    style: style.length ? style : ['스타일을 판단하려면 묶음마다 게시물이 3개 이상 필요해.'],
    next: style.length ? [`가장 높았던 묶음으로 다음 2주 게시물 절반을 만들고, 중앙값이 유지되는지 확인하기.`] : ['스타일별로 게시물을 3개 이상 쌓고 수치를 입력하기.'],
  };
}

export async function createReport(creatorId: string, auto: boolean): Promise<Report> {
  const hub = await readHub();
  const creator = hub.creators.find((c) => c.id === creatorId);
  if (!creator) throw new Error('계정을 찾지 못했어요.');
  const { start, end: fullEnd } = nextPeriod(creator, hub);
  const today = todayKST();
  // 기간이 안 끝났으면 오늘까지로 중간 점검을 만든다
  const interim = fullEnd >= today;
  const end = interim ? today : fullEnd;
  const numbers = computeNumbers(hub.posts.filter((p) => p.creatorId === creatorId), hub.followers.filter((f) => f.creatorId === creatorId), hub.queue.filter((q) => q.creatorId === creatorId), start, end);
  let narrative = rulesNarrative(numbers, interim);
  let author: Report['author'] = AI.mock ? 'mock' : 'rules';
  if (!AI.mock && aiReady()) {
    try {
      narrative = await writeNarrative(numbers, creator, `${start} ~ ${end}`);
      author = 'ai';
    } catch (e) {
      if (!(e instanceof AiSetupError)) console.error('report narrative failed', e);
    }
  }
  const report: Report = { id: newId(), creatorId, periodStart: start, periodEnd: end, numbers, narrative, author, auto, ...(interim ? { interim: true } : {}), createdAt: new Date().toISOString() };
  await mutate((h) => {
    // 중간 점검은 최신 것 하나만 둔다. 정식 보고서가 나오면 지운다.
    h.reports = h.reports.filter((r) => !(r.creatorId === creatorId && r.interim && r.periodStart === start));
    if (!h.reports.some((r) => r.creatorId === creatorId && r.periodStart === start)) h.reports.push(report);
  });
  return report;
}

/** 기간이 끝난 계정의 보고서를 자동으로 만든다. 수치가 없는 계정은 건너뛴다. */
export async function reportsDue(now = new Date()) {
  const hub = await readHub();
  const today = todayKST(now);
  for (const c of hub.creators) {
    const { end } = nextPeriod(c, hub);
    if (today <= end) continue;
    if (!hub.posts.some((p) => p.creatorId === c.id && p.metrics.length)) continue;
    await createReport(c.id, true);
  }
}

export async function tick(now = new Date()) {
  await postDueItems(now);
  await reportsDue(now);
}
