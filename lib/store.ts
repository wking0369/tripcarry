'use client';

// P2P 직구 매칭 데모의 데이터 저장소. 서버 DB 없이 브라우저(localStorage)에만 저장한다.
// 실제 서비스로 넘어갈 때 이 파일의 함수들을 API 호출로 바꾸면 화면은 그대로 쓸 수 있다.

import { useEffect, useSyncExternalStore } from 'react';
import type { Category, CountryCode } from './customs';
import { breakdown, rewardFor, type ItemSize } from './fees';
import { RULES } from './rules';

export { FEES, breakdown, rewardFor } from './fees';

export type Status = 'open' | 'matched' | 'escrow' | 'purchased' | 'delivered' | 'settled' | 'cancelled';

export interface Req {
  id: string;
  createdAt: string;
  buyer: string;
  title: string;
  link: string;
  category: Category;
  qty: number;
  unitUSD: number;
  /** 보상금: 기본은 rewardFor(물품 금액) (최소 $10, 10%). 구매자가 더 올릴 수 있다 */
  rewardUSD: number;
  packaging: 'box' | 'nobox';
  size: ItemSize;
  details: string;
  /** 기다릴 수 있는 기간 (일) */
  waitDays: number;
  from: CountryCode;
  to: CountryCode;
  toCity: string;
  neededBy: string;
  note: string;
  status: Status;
  tripId?: string;
  dutyUSD: number;
  /** 사진 증빙 3단계: 구매(물품+영수증) · 포장(전달 직전 상태) · 수령(현장 사진) */
  proofs: { purchase?: string; pack?: string; handover?: string };
  /** 구매자가 현장에서 보여 주는 수령 코드 (QR 대신) */
  code: string;
  /** 자동 처리 기한 (ISO) */
  receiptDue?: string;
  confirmDue?: string;
  chat: ChatMsg[];
  history: { at: string; text: string }[];
}

export interface ChatMsg {
  at: string;
  from: 'buyer' | 'traveler' | 'system';
  text: string;
}

export interface Trip {
  id: string;
  createdAt: string;
  traveler: string;
  from: CountryCode;
  fromCity: string;
  to: CountryCode;
  toCity: string;
  departDate: string;
  arriveDate: string;
  spaceKg: number;
  resident: boolean;
  verified: boolean;
  note: string;
  rating: number;
  reviews: number;
  suspendedUntil?: string;
}

export interface State {
  requests: Req[];
  trips: Trip[];
  /** 미리보기용 시간 빨리 감기 (ms) */
  offsetMs: number;
}

export const STATUS_LABEL: Record<Status, string> = {
  open: '여행자 찾는 중',
  matched: '결제 대기',
  escrow: '결제 완료 · 보관 중',
  purchased: '구매 완료',
  delivered: '전달 완료',
  settled: '정산 완료',
  cancelled: '취소됨',
};

export const FLOW: Status[] = ['open', 'matched', 'escrow', 'purchased', 'delivered', 'settled'];

const KEY = 'tripcarry-demo-v3';
const EMPTY: State = { requests: [], trips: [], offsetMs: 0 };
let state: State | null = null;
const listeners = new Set<() => void>();

function day(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function nowMs() {
  return Date.now() + (state?.offsetMs ?? 0);
}

function now() {
  return new Date(nowMs()).toISOString();
}

function hoursFromNow(h: number) {
  return new Date(nowMs() + h * 3600_000).toISOString();
}

/** 미리보기 화면에서 쓰는 현재 시각 (빨리 감기 포함) */
export function demoNow(s: State) {
  return Date.now() + s.offsetMs;
}

function code6() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** 평점이 낮거나 정지된 여행자는 매칭할 수 없다 */
export function tripBlocked(t: Trip, at: number): string | null {
  if (t.suspendedUntil && new Date(t.suspendedUntil).getTime() > at) return '노쇼로 계정 일시 정지 중';
  if (t.reviews >= RULES.minReviews && t.rating <= RULES.minRating) return `평점 ${t.rating.toFixed(1)} — 매칭 제한`;
  return null;
}

export function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function seed(): State {
  const t = now();
  const trips: Trip[] = [
    { id: 't_minseo', createdAt: t, traveler: '민서', from: 'US', fromCity: 'LA', to: 'KR', toCity: '서울', departDate: day(5), arriveDate: day(6), spaceKg: 6, resident: true, verified: true, note: '캐리어 하나 반 정도 비어요. 강남·성수 직접 전달 가능.', rating: 4.9, reviews: 23 },
    { id: 't_junho', createdAt: t, traveler: '준호', from: 'FR', fromCity: '파리', to: 'KR', toCity: '서울', departDate: day(9), arriveDate: day(10), spaceKg: 4, resident: true, verified: true, note: '마레 지구 근처 숙소. 향수·화장품 환영.', rating: 4.7, reviews: 8 },
    { id: 't_emily', createdAt: t, traveler: 'Emily', from: 'KR', fromCity: '서울', to: 'US', toCity: 'New York', departDate: day(12), arriveDate: day(12), spaceKg: 5, resident: true, verified: false, note: 'K-beauty 올리브영 쇼핑 가능해요.', rating: 0, reviews: 0 },
    { id: 't_haru', createdAt: t, traveler: '하루', from: 'JP', fromCity: '도쿄', to: 'KR', toCity: '부산', departDate: day(3), arriveDate: day(3), spaceKg: 3, resident: true, verified: true, note: '시부야·이케부쿠로 들를 예정.', rating: 4.8, reviews: 12 },
    { id: 't_tae', createdAt: t, traveler: '태호', from: 'FR', fromCity: '니스', to: 'KR', toCity: '서울', departDate: day(7), arriveDate: day(8), spaceKg: 5, resident: true, verified: true, note: '남부 프랑스 약국 화장품 가능.', rating: 3.6, reviews: 9 },
  ];
  const mk = (r: Omit<Req, 'createdAt' | 'history' | 'dutyUSD' | 'proofs' | 'code' | 'chat' | 'packaging' | 'size' | 'details' | 'waitDays'> & Partial<Req>): Req => ({
    createdAt: t,
    dutyUSD: 0,
    packaging: 'nobox',
    size: 'small',
    details: '',
    waitDays: 30,
    proofs: {},
    code: code6(),
    chat: [],
    history: [{ at: t, text: '구매 요청 등록' }],
    ...r,
    rewardUSD: rewardFor(r.unitUSD * r.qty),
  });
  const requests: Req[] = [
    mk({ id: 'r_jason', buyer: '제이슨', title: '르 라보 상탈 33 오 드 퍼퓸 50ml', link: 'https://www.lelabofragrances.com', category: 'cosmetics', qty: 1, unitUSD: 230, rewardUSD: 25, from: 'FR', to: 'KR', toCity: '서울', neededBy: day(20), note: '파리 매장 가격이 훨씬 싸서요. 선물 포장 부탁드려요.', status: 'open' }),
    mk({ id: 'r_seoyeon', buyer: '서연', title: '포켓몬센터 도쿄 한정 피카츄 인형', link: 'https://www.pokemoncenter-online.com', category: 'general', qty: 2, unitUSD: 28, rewardUSD: 12, from: 'JP', to: 'KR', toCity: '부산', neededBy: day(14), note: '', status: 'open' }),
    mk({ id: 'r_bagel', buyer: '도윤', title: "Trader Joe's 에브리띵 베이글 시즈닝", link: 'https://www.traderjoes.com', category: 'food', qty: 6, unitUSD: 3, rewardUSD: 10, from: 'US', to: 'KR', toCity: '서울', neededBy: day(30), note: '밀봉 새 제품으로요.', status: 'open' }),
    mk({ id: 'r_watch', buyer: '지훈', title: 'Apple Watch Ultra 3 (미국 판매가)', size: 'medium', packaging: 'box', link: 'https://www.apple.com/shop', category: 'electronics', qty: 1, unitUSD: 799, rewardUSD: 60, from: 'US', to: 'KR', toCity: '서울', neededBy: day(25), note: '관세는 제가 부담할게요.', status: 'open' }),
    mk({ id: 'r_cosrx', buyer: 'Sarah', title: 'COSRX 스네일 96 뮤신 에센스', link: 'https://www.oliveyoung.co.kr', category: 'cosmetics', qty: 3, unitUSD: 18, rewardUSD: 15, from: 'KR', to: 'US', toCity: 'New York', neededBy: day(30), note: 'Olive Young price please!', status: 'open' }),
    mk({
      id: 'r_nike', buyer: '현우', title: 'Nike 한정판 스니커즈 (US 9)', size: 'medium', packaging: 'box', link: 'https://www.nike.com', category: 'general', qty: 1, unitUSD: 180, rewardUSD: 35, from: 'US', to: 'KR', toCity: '서울', neededBy: day(15), note: '', status: 'escrow', tripId: 't_minseo',
      receiptDue: new Date(Date.now() + 40 * 3600_000).toISOString(),
      chat: [
        { at: t, from: 'system', text: '매칭됐어요. 전달 장소·시간은 이 채팅에서 직접 정해 주세요.' },
        { at: t, from: 'buyer', text: '안녕하세요! 성수역 근처에서 받을 수 있을까요?' },
        { at: t, from: 'traveler', text: '네 좋아요. 도착 다음 날 저녁 7시 어떠세요?' },
      ],
      history: [{ at: t, text: '구매 요청 등록' }, { at: t, text: '민서 님이 수락' }, { at: t, text: '구매자 결제 완료 — 플랫폼이 대금 보관 중' }],
    }),
  ];
  return { requests, trips, offsetMs: 0 };
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if (Array.isArray(parsed.requests) && Array.isArray(parsed.trips)) return { ...parsed, offsetMs: parsed.offsetMs ?? 0 };
    }
  } catch {
    /* 저장소를 못 쓰면 샘플로 시작 */
  }
  return seed();
}

function get(): State {
  if (typeof window === 'undefined') return EMPTY;
  if (!state) state = load();
  return state;
}

function set(next: State) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* 저장 실패해도 화면은 계속 동작 */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      state = load();
      l();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener('storage', onStorage);
  };
}

export function useP2P(): State & { ready: boolean } {
  const s = useSyncExternalStore(subscribe, get, () => EMPTY);
  // 화면을 열 때마다 기한이 지난 거래를 자동 처리한다.
  useEffect(() => {
    actions.tick();
  }, []);
  return { ...s, ready: s !== EMPTY };
}

function updateReq(id: string, fn: (r: Req) => Req) {
  const s = get();
  set({ ...s, requests: s.requests.map((r) => (r.id === id ? fn(r) : r)) });
}

function log(r: Req, text: string): Req['history'] {
  return [...r.history, { at: now(), text }];
}

function sys(r: Req, text: string): ChatMsg[] {
  return [...r.chat, { at: now(), from: 'system', text }];
}

/**
 * 자동 처리 규칙. 화면을 열 때와 시간을 빨리 감을 때 실행된다.
 * 실제 서비스에서는 서버의 예약 작업(cron)이 같은 일을 한다.
 */
function runAuto(s: State): State {
  const at = Date.now() + s.offsetMs;
  const stamp = new Date(at).toISOString();
  let trips = s.trips;
  let changed = false;
  const requests = s.requests.map((r) => {
    const hist = (text: string) => [...r.history, { at: stamp, text }];
    if (r.status === 'open' && r.neededBy) {
      const cutoff = new Date(r.neededBy + 'T00:00:00').getTime() - RULES.matchCutoffHours * 3600_000;
      if (at >= cutoff) {
        changed = true;
        return { ...r, status: 'cancelled' as Status, history: hist(`[자동] 희망일 ${RULES.matchCutoffHours}시간 전까지 매칭이 안 돼서 취소 (결제 전이라 청구 없음)`) };
      }
    }
    if (r.status === 'escrow' && r.receiptDue && at >= new Date(r.receiptDue).getTime() && !r.proofs.purchase) {
      changed = true;
      const until = new Date(at + RULES.noShowSuspendDays * 86400_000).toISOString();
      trips = trips.map((t) => (t.id === r.tripId ? { ...t, suspendedUntil: until } : t));
      return {
        ...r,
        status: 'cancelled' as Status,
        history: hist(`[자동] ${RULES.receiptDueHours}시간 안에 구매 인증이 없어 취소 · 구매자 전액 환불 · 여행자 보증금 몰수 및 ${RULES.noShowSuspendDays}일 정지`),
      };
    }
    if (r.status === 'delivered' && r.confirmDue && at >= new Date(r.confirmDue).getTime()) {
      changed = true;
      return { ...r, status: 'settled' as Status, history: hist(`[자동] ${RULES.confirmDueHours}시간 동안 수령 확인이 없어 자동 수령 처리 · 여행자 정산`) };
    }
    return r;
  });
  return changed ? { ...s, requests, trips } : s;
}

export const actions = {
  addRequest(r: Omit<Req, 'id' | 'createdAt' | 'status' | 'history' | 'dutyUSD' | 'proofs' | 'code' | 'chat' | 'rewardUSD'> & { dutyUSD?: number; rewardUSD?: number }) {
    const s = get();
    const req: Req = {
      dutyUSD: 0,
      ...r,
      rewardUSD: Math.max(rewardFor(r.unitUSD * r.qty), r.rewardUSD ?? 0),
      id: uid('r'),
      createdAt: now(),
      status: 'open',
      proofs: {},
      code: code6(),
      chat: [],
      history: [{ at: now(), text: r.dutyUSD ? `구매 요청 등록 · 예상 세금 $${r.dutyUSD.toFixed(0)} 부담 동의` : '구매 요청 등록' }],
    };
    set({ ...s, requests: [req, ...s.requests] });
    return req.id;
  },
  addTrip(t: Omit<Trip, 'id' | 'createdAt' | 'rating' | 'reviews'>) {
    const s = get();
    const trip: Trip = { ...t, id: uid('t'), createdAt: now(), rating: 0, reviews: 0 };
    set({ ...s, trips: [trip, ...s.trips] });
    return trip.id;
  },
  accept(reqId: string, trip: Trip, dutyUSD: number) {
    updateReq(reqId, (r) => ({
      ...r,
      status: 'matched',
      tripId: trip.id,
      dutyUSD: Math.max(r.dutyUSD, dutyUSD),
      chat: sys(r, '매칭됐어요. 전달 장소·시간은 이 채팅에서 직접 정해 주세요.'),
      history: log(r, `${trip.traveler} 님이 수락${dutyUSD > 0 ? ` (관세 선결제 $${dutyUSD.toFixed(0)} 포함)` : ''}`),
    }));
  },
  pay(reqId: string) {
    updateReq(reqId, (r) => ({
      ...r,
      status: 'escrow',
      receiptDue: hoursFromNow(RULES.receiptDueHours),
      chat: sys(r, `결제 완료. 여행자는 ${RULES.receiptDueHours}시간 안에 [물품+영수증] 사진을 올려야 해요.`),
      history: log(r, '구매 전 확인 사항 동의 · 결제 완료 — 플랫폼이 대금 보관 중'),
    }));
  },
  proofPurchase(reqId: string, file: string) {
    updateReq(reqId, (r) => ({
      ...r,
      status: 'purchased',
      proofs: { ...r.proofs, purchase: file },
      chat: sys(r, '구매 인증 사진이 올라왔어요.'),
      history: log(r, `① 구매 인증 — 물품+영수증 사진 (${file})`),
    }));
  },
  proofPack(reqId: string, file: string) {
    updateReq(reqId, (r) => ({ ...r, proofs: { ...r.proofs, pack: file }, history: log(r, `② 포장 인증 — 전달 직전 상태 사진 (${file})`) }));
  },
  /** 현장에서 구매자 수령 코드를 입력하면 즉시 수령·정산 */
  handoverCode(reqId: string, input: string) {
    const r = get().requests.find((x) => x.id === reqId);
    if (!r || input.trim() !== r.code) return false;
    updateReq(reqId, (x) => ({
      ...x,
      status: 'settled',
      proofs: { ...x.proofs, handover: '현장 수령 코드 확인' },
      chat: sys(x, '수령 코드 확인 — 거래 완료.'),
      history: log(x, '③ 수령 인증 — 현장 수령 코드 확인 · 즉시 수령 처리 · 여행자 정산'),
    }));
    return true;
  },
  handoverPhoto(reqId: string, file: string) {
    updateReq(reqId, (r) => ({
      ...r,
      status: 'delivered',
      proofs: { ...r.proofs, handover: file },
      confirmDue: hoursFromNow(RULES.confirmDueHours),
      chat: sys(r, `전달 사진이 올라왔어요. ${RULES.confirmDueHours}시간 안에 확인하지 않으면 자동 수령 처리돼요.`),
      history: log(r, `③ 수령 인증 — 현장 전달 사진 (${file})`),
    }));
  },
  confirm(reqId: string) {
    updateReq(reqId, (r) => ({ ...r, status: 'settled', history: log(r, '구매자 수령 확인 — 여행자에게 정산') }));
  },
  cancel(reqId: string) {
    updateReq(reqId, (r) => {
      const refunded = r.status === 'escrow';
      return { ...r, status: 'cancelled', history: log(r, refunded ? '취소 — 보관 중이던 대금 전액 자동 환불' : '취소') };
    });
  },
  release(reqId: string) {
    updateReq(reqId, (r) => ({ ...r, status: 'open', tripId: undefined, history: log(r, '매칭 해제 — 다시 여행자 찾는 중') }));
  },
  send(reqId: string, from: 'buyer' | 'traveler', text: string) {
    const t = text.trim().slice(0, 500);
    if (!t) return;
    updateReq(reqId, (r) => ({ ...r, chat: [...r.chat, { at: now(), from, text: t }] }));
  },
  /** 미리보기: 시간을 빨리 감아 자동 규칙을 확인 */
  advance(hours: number) {
    const s = get();
    set(runAuto({ ...s, offsetMs: s.offsetMs + hours * 3600_000 }));
  },
  tick() {
    const s = get();
    const next = runAuto(s);
    if (next !== s) set(next);
  },
  reset() {
    state = null;
    set(seed());
  },
};

/** 여행자가 이번 여행에 이미 맡은 물품 금액 (면세 한도는 여행자 한 명 기준이라 합산) */
export function tripLoadUSD(s: State, tripId: string, exceptReqId?: string) {
  return s.requests
    .filter((r) => r.tripId === tripId && r.id !== exceptReqId && r.status !== 'cancelled' && r.status !== 'open')
    .reduce((sum, r) => sum + r.unitUSD * r.qty, 0);
}

export function fitsTrip(r: Req, t: Trip) {
  return r.from === t.from && r.to === t.to && (!r.neededBy || r.neededBy >= t.arriveDate);
}
