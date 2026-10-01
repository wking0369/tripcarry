// 랜딩·대기자 등록 화면의 영어/한국어 문구. 기본은 영어(레딧 수요 조사용).
export type Lang = 'en' | 'ko';
export const LANG_COOKIE = 'tc_lang';

export function toLang(v: string | undefined | null): Lang {
  return v === 'ko' ? 'ko' : 'en';
}

const en = {
  nav: { join: 'Join the waitlist', other: '한국어' },
  badge: 'Launching soon',
  h1a: 'Get it from abroad.',
  h1b: 'A traveler brings it.',
  sub: 'Someone already flying your way buys it in-store and hands it to you.',
  ctaBuyer: 'Request an item',
  ctaTraveler: 'I’m traveling — earn money',
  perk: 'Waitlist = first order fee-free',
  benefits: [
    { icon: 'globe', title: 'Not sold at home?', desc: 'Store-only, limited and local items' },
    { icon: 'box', title: 'No international shipping', desc: 'Pay a small traveler reward instead' },
    { icon: 'tag', title: 'Skip the markup', desc: 'Pay the local price, not the import price' },
  ],
  compareTitle: 'Same item, three ways to buy',
  compareNote: 'Illustrative example — actual prices vary by item.',
  compare: [
    { label: 'Buy at home', note: 'Import markup', value: 180, shown: '$180' },
    { label: 'Order from abroad', note: 'Local price + shipping + duty', value: 150, shown: '$150' },
    { label: 'TripCarry', note: 'Local price + reward + fee', value: 120, shown: '$120', best: true },
  ],
  routesTitle: 'Opening first on these routes',
  routes: [
    { from: ['FR', 'IT'], to: ['KR'], title: 'Europe → Korea', items: ['Luxury goods', 'Pharmacy skincare', 'Limited-edition merch'], cta: 'Request this route' },
    { from: ['KR'], to: ['CN', 'VN', 'TH', 'SG', 'AE'], title: 'Korea → China · SE Asia · Middle East', items: ['K-beauty', 'K-pop exclusive merch', 'Health supplements'], cta: 'Request this route' },
  ],
  stepsTitle: 'How it works',
  steps: [
    { title: 'Request', desc: 'Paste a link and set a reward' },
    { title: 'A traveler buys it', desc: 'In-store, with a receipt' },
    { title: 'Receive & confirm', desc: 'Payment is released only then' },
  ],
  trust: ['Escrow payment', 'In-store purchase + receipt', 'Duty-free limits checked', 'Verified travelers'],
  finalTitle: 'Would you use this?',
  finalSub: 'Tell us what you’d buy or carry. It decides which routes open first.',
  footer1: 'TripCarry is not live yet. We’re collecting interest before launch.',
  footer2: 'Duty-free limits shown are approximate. Always check official customs guidance before you travel.',
  terms: 'Terms',
  privacy: 'Privacy',
  calc: 'Duty-free calculator',
  preview: 'Interactive preview (sample data, Korean)',
  modal: {
    title: 'Get early access',
    sub: 'We’re launching route by route. Join the waitlist and your first order is fee-free.',
    email: 'Email',
    role: 'I want to…',
    roles: { buyer: 'Get items', traveler: 'Carry items', both: 'Both' },
    from: 'From (buy in)',
    to: 'To (deliver to)',
    item: 'What would you buy or carry?',
    itemPh: 'e.g. Pokémon Center plush, Le Labo perfume, K-beauty',
    pay: 'Reward you’d pay / want (USD)',
    payPh: 'e.g. 20',
    optional: 'optional',
    submit: 'Join the waitlist',
    sending: 'Joining…',
    consent: 'We’ll only email you about the launch. Unsubscribe anytime.',
    doneTitle: 'You’re on the list!',
    doneSub: 'We’ll email you when your route opens. Your first order will be fee-free.',
    share: 'Know someone who travels a lot? Share this page with them.',
    close: 'Close',
    pick: 'Select',
    errorGeneric: 'Something went wrong. Please try again.',
    errorEmail: 'Please enter a valid email.',
    errorBusy: 'Too many tries. Please wait a minute and try again.',
  },
};

type Dict = typeof en;

const ko: Dict = {
  nav: { join: '사전 등록', other: 'English' },
  badge: '출시 준비 중',
  h1a: '해외 물건,',
  h1b: '여행자가 들고 와요.',
  sub: '그 나라에서 오는 여행자가 매장에서 직접 사서 전해 줘요.',
  ctaBuyer: '물건 요청하기',
  ctaTraveler: '여행 가요 · 돈 벌기',
  perk: '사전 등록하면 첫 거래 수수료 무료',
  benefits: [
    { icon: 'globe', title: '국내에 없는 물건', desc: '현지 매장 전용·한정판·현지 상품' },
    { icon: 'box', title: '국제 배송비 0원', desc: '대신 여행자 보상금만 조금' },
    { icon: 'tag', title: '정가 거품 없이', desc: '수입가 말고 현지 가격 그대로' },
  ],
  compareTitle: '같은 물건, 세 가지 구매 방법',
  compareNote: '이해를 돕기 위한 예시 금액이에요. 실제 가격은 물건마다 달라요.',
  compare: [
    { label: '국내에서 사면', note: '수입 유통 마진', value: 180, shown: '18만 원' },
    { label: '해외 직구', note: '현지가 + 배송비 + 관세', value: 150, shown: '15만 원' },
    { label: 'TripCarry', note: '현지가 + 보상금 + 수수료', value: 120, shown: '12만 원', best: true },
  ],
  routesTitle: '이 노선부터 열어요',
  routes: [
    { from: ['FR', 'IT'], to: ['KR'], title: '유럽 → 한국', items: ['현지 명품', '약국 화장품', '한정판 굿즈'], cta: '이 노선 요청하기' },
    { from: ['KR'], to: ['CN', 'VN', 'TH', 'SG', 'AE'], title: '한국 → 중국 · 동남아 · 중동', items: ['K-뷰티', 'K-POP 한정 굿즈', '건강기능식품'], cta: '이 노선 요청하기' },
  ],
  stepsTitle: '이용 방법',
  steps: [
    { title: '요청', desc: '링크 붙이고 보상금 정하기' },
    { title: '여행자가 구매', desc: '매장에서 직접, 영수증 첨부' },
    { title: '받고 확인', desc: '확인해야 결제가 확정돼요' },
  ],
  trust: ['에스크로 결제', '매장 직접 구매·영수증', '면세 한도 자동 확인', '인증된 여행자'],
  finalTitle: '이런 서비스, 쓰실 건가요?',
  finalSub: '사고 싶은(또는 들고 갈 수 있는) 물건을 알려 주세요. 어떤 노선부터 열지 정하는 데 써요.',
  footer1: 'TripCarry는 아직 출시 전이에요. 출시 전에 관심을 모으고 있어요.',
  footer2: '면세 한도는 참고용이에요. 출국 전 각국 세관 공지를 꼭 확인하세요.',
  terms: '이용약관',
  privacy: '개인정보 처리방침',
  calc: '면세 한도 계산기',
  preview: '동작하는 미리보기 (샘플 데이터)',
  modal: {
    title: '사전 등록',
    sub: '경로별로 차례차례 열어요. 사전 등록하면 첫 거래 수수료가 무료예요.',
    email: '이메일',
    role: '저는…',
    roles: { buyer: '물건을 받고 싶어요', traveler: '물건을 들고 갈래요', both: '둘 다' },
    from: '구매 국가',
    to: '받을 국가',
    item: '사고 싶은(들고 갈 수 있는) 물건',
    itemPh: '예: 포켓몬센터 인형, 르 라보 향수, 트레이더조 간식',
    pay: '낼(받고 싶은) 보상금 (USD)',
    payPh: '예: 20',
    optional: '선택',
    submit: '사전 등록하기',
    sending: '등록 중…',
    consent: '출시 소식만 보내요. 언제든 수신을 거부할 수 있어요.',
    doneTitle: '등록됐어요!',
    doneSub: '경로가 열리면 메일로 알려 드릴게요. 첫 거래 수수료는 무료예요.',
    share: '여행을 자주 다니는 친구가 있다면 이 페이지를 공유해 주세요.',
    close: '닫기',
    pick: '선택',
    errorGeneric: '문제가 생겼어요. 다시 시도해 주세요.',
    errorEmail: '이메일 주소를 확인해 주세요.',
    errorBusy: '시도가 너무 많아요. 1분 뒤에 다시 해 주세요.',
  },
};

export const DICT: Record<Lang, Dict> = { en, ko };
export type { Dict };

/** 사전 등록 폼에서 고르는 나라 (ISO 코드). 이름은 브라우저 Intl.DisplayNames로 표시한다. */
export const WAITLIST_COUNTRIES = [
  'US', 'KR', 'JP', 'CN', 'TW', 'HK', 'VN', 'TH', 'PH', 'ID', 'SG', 'MY', 'IN',
  'GB', 'FR', 'DE', 'IT', 'ES', 'NL', 'CA', 'MX', 'BR', 'AR', 'AU', 'NZ', 'AE', 'SA', 'QA', 'KW',
];

export function countryName(code: string, lang: Lang) {
  if (!code) return '';
  if (code === 'OTHER') return lang === 'ko' ? '기타' : 'Other';
  try {
    return new Intl.DisplayNames([lang], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}
