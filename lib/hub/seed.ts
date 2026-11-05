// 화면을 시험하기 위한 가상 데이터. 실제 인물·계정이 아니고, 스튜디오에서 언제든 지울 수 있다.
import { addDays, todayKST, type Creator, type FollowerPoint, type Post, type PostKind } from './types';

// 같은 결과가 나오는 간단한 난수
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const TOPICS = ['창업 첫걸음', '돈과 시간', '실패담', '거리 인터뷰'];
const HOOK_TYPES = ['질문형', '숫자형', '반전형', '고백형'];
const STYLES = ['노란 큰자막', '흰색 하단 자막', '검정 박스 자막'];
const HOOKS: Record<string, string[]> = {
  질문형: ['지금 하는 일, 10년 뒤에도 하고 싶으세요?', '왜 다들 시작 전에 포기할까요?', '돈이 없어서 못 한다는 말, 진짜일까요?'],
  숫자형: ['첫 고객 3명이 모든 걸 바꿨습니다', '30일 안에 첫 매출을 만드는 방법', '100번 거절당하고 배운 한 가지'],
  반전형: ['회사를 팔고 나서야 알았습니다', '성공한 사람들은 계획을 안 세웁니다', '제일 잘한 결정은 그만둔 일이었어요'],
  고백형: ['저도 처음엔 무서웠어요', '직원 월급을 못 줬던 날', '제가 가장 후회하는 말'],
};

export function buildSample(today = todayKST()): { creators: Creator[]; posts: Post[]; followers: FollowerPoint[] } {
  const r = rng(20261104);
  const creatorId = 'sample-creator';
  const start = addDays(today, -75);
  const creator: Creator = {
    id: creatorId,
    name: '샘플 크리에이터 (가상)',
    handle: 'sample.creator.kr',
    voice: '따뜻하고 격려하는 말투. 짧은 문장. 설교하지 않음.',
    note: '화면 시험용 가상 계정이에요. 숫자는 모두 만들어 낸 값이에요.',
    career: [
      { id: 'c1', label: '2015~2019', text: '[샘플] 첫 회사를 창업해 운영', addedAt: start },
      { id: 'c2', label: '2019', text: '[샘플] 회사를 매각', addedAt: start },
      { id: 'c3', label: '2021~현재', text: '[샘플] 거리 인터뷰 채널 운영', addedAt: start },
    ],
    quotes: [
      { id: 'q1', label: '[샘플] 인터뷰', text: '완벽한 때를 기다리지 말고, 오늘 할 수 있는 가장 작은 일부터 시작하세요.', addedAt: start },
      { id: 'q2', label: '[샘플] 책 서문', text: '거절은 끝이 아니라 다음 사람에게 가라는 신호예요.', addedAt: start },
    ],
    slots: ['10:00', '20:00'],
    reportStart: addDays(today, -14),
    sample: true,
    createdAt: new Date().toISOString(),
  };

  const posts: Post[] = [];
  const followers: FollowerPoint[] = [];
  let count = 18400;
  for (let i = 0; i <= 75; i++) {
    const date = addDays(start, i);
    let gain = 18 + Math.round(r() * 45);
    if (r() < 0.55) {
      const hookType = HOOK_TYPES[Math.floor(r() * HOOK_TYPES.length)];
      const topic = TOPICS[Math.floor(r() * TOPICS.length)];
      const style = STYLES[Math.floor(r() * STYLES.length)];
      const kind: PostKind = r() < 0.78 ? 'reel' : 'carousel';
      const hook = HOOKS[hookType][Math.floor(r() * 3)];
      // 일부 조합이 더 잘 되도록 만들어 분석 화면에 패턴이 보이게 한다
      let v = 16000 + r() * 42000;
      if (hookType === '반전형') v *= 2.1;
      if (topic === '거리 인터뷰') v *= 1.6;
      if (style === '검정 박스 자막') v *= 0.72;
      if (kind === 'carousel') v *= 0.45;
      if (r() < 0.08) v *= 6 + r() * 6;
      const viewsN = Math.round(v);
      const reach = Math.round(viewsN * (0.68 + r() * 0.2));
      const likes = Math.round(reach * (0.025 + r() * 0.03));
      const saves = Math.round(reach * (0.004 + r() * 0.012) * (kind === 'carousel' ? 2.4 : 1));
      const shares = Math.round(reach * (0.003 + r() * 0.01));
      const comments = Math.round(reach * (0.001 + r() * 0.003));
      const follows = Math.round(reach * (0.0015 + r() * 0.002));
      gain += follows;
      posts.push({
        id: `sample-${i}`,
        creatorId,
        date,
        title: hook,
        kind,
        hook,
        hookType,
        topic,
        style: kind === 'carousel' ? '인용 카드' : style,
        caption: `[샘플 캡션] ${hook}`,
        source: 'sample',
        metrics: [{ at: addDays(date, 3) > today ? today : addDays(date, 3), views: viewsN, reach, likes, comments, saves, shares, follows, ...(kind === 'reel' ? { avgWatchSec: Math.round((6 + r() * 12) * 10) / 10 } : {}) }],
      });
    }
    count += gain;
    followers.push({ creatorId, date, followers: count, sample: true });
  }
  return { creators: [creator], posts, followers };
}
