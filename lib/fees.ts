// 수수료 계산. 서버 컴포넌트(랜딩 페이지)에서도 쓰므로 'use client' 모듈과 분리해 둔다.

export const FEES = {
  /** 구매자 서비스 수수료: 물품 금액의 5% (최소 $2) */
  buyerRate: 0.05,
  buyerMin: 2,
  /** 여행자 수수료: 보상금의 10% */
  travelerRate: 0.1,
};

export function breakdown(r: { unitUSD: number; qty: number; rewardUSD: number; dutyUSD: number }) {
  const item = r.unitUSD * r.qty;
  const buyerFee = item > 0 ? Math.max(FEES.buyerMin, item * FEES.buyerRate) : 0;
  const travelerFee = r.rewardUSD * FEES.travelerRate;
  const buyerPays = item + r.rewardUSD + buyerFee + r.dutyUSD;
  const travelerGets = item + r.rewardUSD - travelerFee + r.dutyUSD;
  return { item, buyerFee, travelerFee, buyerPays, travelerGets, platform: buyerFee + travelerFee };
}
