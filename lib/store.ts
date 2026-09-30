'use client';

// P2P 직구 매칭 데모의 데이터 저장소. 서버 DB 없이 브라우저(localStorage)에만 저장한다.
// 실제 서비스로 넘어갈 때 이 파일의 함수들을 API 호출로 바꾸면 화면은 그대로 쓸 수 있다.

import { useSyncExternalStore } from 'react';
import type { Category, CountryCode } from './customs';
import { breakdown } from './fees';

export { FEES, breakdown } from './fees';

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
  rewardUSD: number;
  from: CountryCode;
  to: CountryCode;
  toCity: string;
  neededBy: string;
  note: string;
  status: Status;
  tripId?: string;
  dutyUSD: number;
  receipt?: string;
  photo?: string;
  history: { at: string; text: string }[];
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
}

export interface State {
  requests: Req[];
  trips: Trip[];
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

const KEY = 'tripcarry-demo-v1';
const EMPTY: State = { requests: [], trips: [] };
let state: State | null = null;
const listeners = new Set<() => void>();

function day(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function now() {
  return new Date().toISOString();
}

export function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function seed(): State {
  const t = now();
  const trips: Trip[] = [
    { id: 't_minseo', createdAt: t, traveler: '민서', from: 'US', fromCity: 'LA', to: 'KR', toCity: '서울', departDate: day(5), arriveDate: day(6), spaceKg: 6, resident: true, verified: true, note: '캐리어 하나 반 정도 비어요. 강남·성수 직접 전달 가능.' },
    { id: 't_junho', createdAt: t, traveler: '준호', from: 'FR', fromCity: '파리', to: 'KR', toCity: '서울', departDate: day(9), arriveDate: day(10), spaceKg: 4, resident: true, verified: true, note: '마레 지구 근처 숙소. 향수·화장품 환영.' },
    { id: 't_emily', createdAt: t, traveler: 'Emily', from: 'KR', fromCity: '서울', to: 'US', toCity: 'New York', departDate: day(12), arriveDate: day(12), spaceKg: 5, resident: true, verified: false, note: 'K-beauty 올리브영 쇼핑 가능해요.' },
    { id: 't_haru', createdAt: t, traveler: '하루', from: 'JP', fromCity: '도쿄', to: 'KR', toCity: '부산', departDate: day(3), arriveDate: day(3), spaceKg: 3, resident: true, verified: true, note: '시부야·이케부쿠로 들를 예정.' },
  ];
  const mk = (r: Omit<Req, 'createdAt' | 'history' | 'dutyUSD'> & Partial<Req>): Req => ({
    createdAt: t,
    dutyUSD: 0,
    history: [{ at: t, text: '구매 요청 등록' }],
    ...r,
  });
  const requests: Req[] = [
    mk({ id: 'r_jason', buyer: '제이슨', title: '르 라보 상탈 33 오 드 퍼퓸 50ml', link: 'https://www.lelabofragrances.com', category: 'cosmetics', qty: 1, unitUSD: 230, rewardUSD: 25, from: 'FR', to: 'KR', toCity: '서울', neededBy: day(20), note: '파리 매장 가격이 훨씬 싸서요. 선물 포장 부탁드려요.', status: 'open' }),
    mk({ id: 'r_seoyeon', buyer: '서연', title: '포켓몬센터 도쿄 한정 피카츄 인형', link: 'https://www.pokemoncenter-online.com', category: 'general', qty: 2, unitUSD: 28, rewardUSD: 12, from: 'JP', to: 'KR', toCity: '부산', neededBy: day(14), note: '', status: 'open' }),
    mk({ id: 'r_bagel', buyer: '도윤', title: "Trader Joe's 에브리띵 베이글 시즈닝", link: 'https://www.traderjoes.com', category: 'food', qty: 6, unitUSD: 3, rewardUSD: 10, from: 'US', to: 'KR', toCity: '서울', neededBy: day(30), note: '밀봉 새 제품으로요.', status: 'open' }),
    mk({ id: 'r_watch', buyer: '지훈', title: 'Apple Watch Ultra 3 (미국 판매가)', link: 'https://www.apple.com/shop', category: 'electronics', qty: 1, unitUSD: 799, rewardUSD: 60, from: 'US', to: 'KR', toCity: '서울', neededBy: day(25), note: '관세는 제가 부담할게요.', status: 'open' }),
    mk({ id: 'r_cosrx', buyer: 'Sarah', title: 'COSRX 스네일 96 뮤신 에센스', link: 'https://www.oliveyoung.co.kr', category: 'cosmetics', qty: 3, unitUSD: 18, rewardUSD: 15, from: 'KR', to: 'US', toCity: 'New York', neededBy: day(30), note: 'Olive Young price please!', status: 'open' }),
    mk({
      id: 'r_nike', buyer: '현우', title: 'Nike 한정판 스니커즈 (US 9)', link: 'https://www.nike.com', category: 'general', qty: 1, unitUSD: 180, rewardUSD: 35, from: 'US', to: 'KR', toCity: '서울', neededBy: day(15), note: '', status: 'escrow', tripId: 't_minseo',
      history: [{ at: t, text: '구매 요청 등록' }, { at: t, text: '민서 님이 수락' }, { at: t, text: '구매자 결제 완료 — 플랫폼이 대금 보관 중' }],
    }),
  ];
  return { requests, trips };
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if (Array.isArray(parsed.requests) && Array.isArray(parsed.trips)) return parsed;
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
  return { ...s, ready: s !== EMPTY };
}

function updateReq(id: string, fn: (r: Req) => Req) {
  const s = get();
  set({ ...s, requests: s.requests.map((r) => (r.id === id ? fn(r) : r)) });
}

function log(r: Req, text: string): Req['history'] {
  return [...r.history, { at: now(), text }];
}

export const actions = {
  addRequest(r: Omit<Req, 'id' | 'createdAt' | 'status' | 'history' | 'dutyUSD'>) {
    const s = get();
    const req: Req = { ...r, id: uid('r'), createdAt: now(), status: 'open', dutyUSD: 0, history: [{ at: now(), text: '구매 요청 등록' }] };
    set({ ...s, requests: [req, ...s.requests] });
    return req.id;
  },
  addTrip(t: Omit<Trip, 'id' | 'createdAt'>) {
    const s = get();
    const trip: Trip = { ...t, id: uid('t'), createdAt: now() };
    set({ ...s, trips: [trip, ...s.trips] });
    return trip.id;
  },
  accept(reqId: string, trip: Trip, dutyUSD: number) {
    updateReq(reqId, (r) => ({
      ...r,
      status: 'matched',
      tripId: trip.id,
      dutyUSD,
      history: log(r, `${trip.traveler} 님이 수락${dutyUSD > 0 ? ` (관세 선결제 $${dutyUSD.toFixed(0)} 포함)` : ''}`),
    }));
  },
  pay(reqId: string) {
    updateReq(reqId, (r) => ({ ...r, status: 'escrow', history: log(r, '구매자 결제 완료 — 플랫폼이 대금 보관 중') }));
  },
  purchased(reqId: string, receipt: string) {
    updateReq(reqId, (r) => ({ ...r, status: 'purchased', receipt, history: log(r, `여행자 현지 매장 구매 · 영수증 첨부 (${receipt})`) }));
  },
  delivered(reqId: string, photo: string) {
    updateReq(reqId, (r) => ({ ...r, status: 'delivered', photo, history: log(r, `전달 완료 · 현장 사진 첨부 (${photo})`) }));
  },
  confirm(reqId: string) {
    updateReq(reqId, (r) => ({ ...r, status: 'settled', history: log(r, '구매자 수령 확인 — 여행자에게 정산') }));
  },
  cancel(reqId: string) {
    updateReq(reqId, (r) => {
      const refunded = r.status === 'escrow' || r.status === 'purchased';
      return { ...r, status: 'cancelled', history: log(r, refunded ? '취소 — 보관 중이던 대금 전액 환불' : '취소') };
    });
  },
  release(reqId: string) {
    updateReq(reqId, (r) => ({ ...r, status: 'open', tripId: undefined, dutyUSD: 0, history: log(r, '매칭 해제 — 다시 여행자 찾는 중') }));
  },
  reset() {
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
