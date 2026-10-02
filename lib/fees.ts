// 수수료·보상금 계산. 서버 컴포넌트에서도 쓰므로 'use client' 모듈과 분리해 둔다.

export const FEES = {
  /** 여행자 보상금: 물품 금액의 10%, 최소 $10 */
  rewardRate: 0.1,
  rewardMin: 10,
  /** TripCarry 플랫폼 수수료(구매자): 물품 금액의 5%, 최소 $2 */
  platformRate: 0.05,
  platformMin: 2,
  /** 결제사 수수료(카드·PG): 결제 금액의 2.9% + $0.30 — 결제사에 그대로 나가는 돈 */
  paymentRate: 0.029,
  paymentFixed: 0.3,
  /** 여행자 수수료: 보상금의 10% (여행자 정산에서 차감) */
  travelerRate: 0.1,
};

const round = (n: number) => Math.round(n * 100) / 100;

export function rewardFor(itemUSD: number) {
  return itemUSD > 0 ? round(Math.max(FEES.rewardMin, itemUSD * FEES.rewardRate)) : 0;
}

export function breakdown(r: { unitUSD: number; qty: number; dutyUSD: number }) {
  const item = round(r.unitUSD * r.qty);
  const reward = rewardFor(item);
  const platformFee = item > 0 ? round(Math.max(FEES.platformMin, item * FEES.platformRate)) : 0;
  const duty = round(r.dutyUSD || 0);
  const subtotal = item + reward + platformFee + duty;
  const paymentFee = item > 0 ? round(subtotal * FEES.paymentRate + FEES.paymentFixed) : 0;
  const buyerPays = round(subtotal + paymentFee);
  const travelerFee = round(reward * FEES.travelerRate);
  const travelerGets = round(item + reward - travelerFee + duty);
  return {
    item,
    reward,
    platformFee,
    paymentFee,
    duty,
    buyerPays,
    travelerFee,
    travelerGets,
    /** TripCarry 몫 (결제사 수수료는 제외) */
    platform: round(platformFee + travelerFee),
    /** 하위 호환: 예전 화면 이름 */
    buyerFee: platformFee,
  };
}

// ---------- 정식 국제 배송과 비교 (앵커 가격) ----------

export type ItemSize = 'small' | 'medium' | 'large';

/** 국제 특송(DHL·FedEx 등) 예상 배송비 — 크기별 대략값. 실제 요금은 무게·지역마다 다르다. */
export const EXPRESS_SHIPPING: Record<ItemSize, { usd: number; label: string; hint: string }> = {
  small: { usd: 35, label: '작음', hint: '화장품·인형·약 (0.5kg 이하)' },
  medium: { usd: 55, label: '보통', hint: '신발·가방·전자기기 (2kg 이하)' },
  large: { usd: 90, label: '큼', hint: '부피 큰 물건 (5kg 이하)' },
};

/** 직구 소액 면세 기준 (대략) — 넘으면 관세·부가세가 붙는다 */
const MAIL_DE_MINIMIS_USD: Record<string, number> = { KR: 150, US: 800, JP: 70, CN: 7, VN: 40, FR: 150, DE: 150 };

export function anchorPrice(o: { itemUSD: number; size: ItemSize; to: string; dutyRate: number }) {
  const shipping = EXPRESS_SHIPPING[o.size].usd;
  const limit = MAIL_DE_MINIMIS_USD[o.to] ?? 150;
  const duty = o.itemUSD > limit ? round(o.itemUSD * o.dutyRate) : 0;
  return { shipping, duty, total: round(o.itemUSD + shipping + duty) };
}
