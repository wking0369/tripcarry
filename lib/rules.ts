// 운영자 없이 시스템이 자동으로 처리하는 거래 규칙. 랜딩·약관·구매 전 확인·미리보기가 모두 이 값을 쓴다.
export const RULES = {
  /** 희망 수령일 이 시간 전까지 매칭이 안 되면 자동 취소 */
  matchCutoffHours: 24,
  /** 결제 후 이 시간 안에 [물품+영수증] 사진이 없으면 자동 취소·전액 환불 */
  receiptDueHours: 48,
  /** 전달 사진 후 이 시간 동안 수령 확인이 없으면 자동 수령 처리·정산 */
  confirmDueHours: 24,
  /** 평점이 이 값 이하면 매칭 제한 (후기가 minReviews개 이상일 때만 적용) */
  minRating: 4.0,
  minReviews: 5,
  /** 노쇼(영수증 기한 초과) 시 계정 정지 기간 */
  noShowSuspendDays: 7,
};
