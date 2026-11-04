// 크리에이터 허브의 데이터 모양. 서버와 브라우저에서 같이 쓴다.

export type PostKind = 'reel' | 'carousel' | 'image';
export const KIND_LABEL: Record<PostKind, string> = { reel: '릴스', carousel: '캐러셀', image: '이미지' };

export interface Metrics {
  at: string; // 입력한 날짜 (YYYY-MM-DD)
  views: number;
  reach: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  follows: number;
  avgWatchSec?: number;
}

export interface Post {
  id: string;
  creatorId: string;
  date: string; // 게시일 (YYYY-MM-DD)
  title: string;
  kind: PostKind;
  hook: string; // 첫 문장
  hookType: string; // 질문형, 숫자형...
  topic: string;
  style: string; // 자막·카드 스타일 이름
  caption: string;
  source: 'manual' | 'csv' | 'sample' | 'trial' | 'card';
  parentId?: string; // 변형본이면 원본 게시물
  trial?: boolean;
  metrics: Metrics[]; // 시간순. 마지막 값이 최신
}

export interface Entry {
  id: string;
  label: string; // 경력: 기간 / 명언: 출처
  text: string;
  addedAt: string;
}

export interface Creator {
  id: string;
  name: string;
  handle: string;
  voice: string; // 말투 메모
  note: string;
  career: Entry[];
  quotes: Entry[];
  slots: string[]; // 하루 게시 시간 (최대 2개, 한국 시간)
  reportStart: string; // 보고서 첫 기간의 시작일
  sample?: boolean;
  createdAt: string;
}

export interface FollowerPoint {
  creatorId: string;
  date: string;
  followers: number;
  sample?: boolean;
}

export type QueueStatus = 'draft' | 'scheduled' | 'posted';

export interface QueueItem {
  id: string;
  creatorId: string;
  sourcePostId: string;
  hook: string;
  hookOptions: string[];
  caption: string;
  changeNote: string; // 원본과 무엇이 달라졌는지
  renderId?: string; // 자막 편집기에서 만든 영상
  status: QueueStatus;
  approvedAt?: string;
  scheduledAt?: string;
  postedAt?: string;
  mode: 'test'; // 인스타 연결 전에는 항상 테스트
  createdAt: string;
}

export interface SubtitleStyle {
  font: string;
  weight: number;
  size: number; // 영상 너비 1080 기준 px
  color: string;
  strokeColor: string;
  strokeWidth: number;
  boxOn: boolean;
  boxColor: string;
  boxOpacity: number;
  xPct: number; // 글자 묶음 중심
  yPct: number;
  maxWidthPct: number;
  lineHeight: number;
}

export const DEFAULT_STYLE: SubtitleStyle = {
  font: 'Noto Sans KR',
  weight: 700,
  size: 64,
  color: '#FFFFFF',
  strokeColor: '#000000',
  strokeWidth: 6,
  boxOn: false,
  boxColor: '#000000',
  boxOpacity: 0.6,
  xPct: 50,
  yPct: 72,
  maxWidthPct: 84,
  lineHeight: 1.3,
};

export const FONTS: { family: string; weights: number[] }[] = [
  { family: 'Noto Sans KR', weights: [500, 700, 900] },
  { family: 'IBM Plex Sans KR', weights: [500, 700] },
  { family: 'Black Han Sans', weights: [400] },
  { family: 'Do Hyeon', weights: [400] },
];

export interface Cue {
  start: number; // 초
  end: number;
  text: string;
}

export interface Render {
  id: string;
  mediaId: string;
  bytes: number;
  createdAt: string;
  label: string;
}

export interface SubtitleProject {
  id: string;
  creatorId: string;
  title: string;
  videoId: string;
  videoBytes: number;
  width: number;
  height: number;
  duration: number;
  cues: Cue[];
  style: SubtitleStyle;
  styleName: string;
  renders: Render[];
  job?: { status: 'running' | 'failed'; error?: string; startedAt: string };
  updatedAt: string;
}

export interface ReportNarrative {
  summary: string;
  worked: string[];
  didnt: string[];
  style: string[];
  next: string[];
}

export interface ReportNumbers {
  posts: number;
  measuredPosts: number;
  followersStart: number | null;
  followersEnd: number | null;
  followerDelta: number | null;
  views: number;
  medianViews: number;
  engagementRate: number | null;
  saves: number;
  shares: number;
  prevViews: number;
  prevMeasuredPosts: number;
  prevFollowerDelta: number | null;
  breakouts: { id: string; title: string; views: number; multiple: number }[];
  groups: { name: string; rows: GroupRow[] }[];
  trialsPosted: number;
}

export interface GroupRow {
  key: string;
  count: number;
  medianViews: number;
  engagementRate: number | null;
}

export interface Report {
  id: string;
  creatorId: string;
  periodStart: string;
  periodEnd: string;
  numbers: ReportNumbers;
  narrative: ReportNarrative;
  author: 'ai' | 'rules' | 'mock';
  auto: boolean;
  interim?: boolean; // 기간이 끝나기 전에 만든 중간 점검
  createdAt: string;
}

export interface Lead {
  id: string;
  at: string;
  name: string;
  email: string;
  handle: string;
  message: string;
}

export interface Hub {
  creators: Creator[];
  posts: Post[];
  followers: FollowerPoint[];
  queue: QueueItem[];
  projects: SubtitleProject[];
  reports: Report[];
  leads: Lead[];
  sampleRemoved?: boolean;
}

export const EMPTY_HUB: Hub = { creators: [], posts: [], followers: [], queue: [], projects: [], reports: [], leads: [] };

// ---------- 날짜 (한국 시간 기준) ----------

export function todayKST(now = new Date()) {
  return new Date(now.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
}

export function addDays(date: string, n: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function fmtNum(n: number) {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(n >= 100_000 ? 0 : 1)}만`;
  return n.toLocaleString('ko-KR');
}

export function fmtPct(r: number | null) {
  return r === null ? '없음' : `${(r * 100).toFixed(1)}%`;
}

export function fmtDateTimeKST(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}
