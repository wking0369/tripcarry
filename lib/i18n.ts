// 랜딩·대기자 등록 화면의 영어/한국어 문구. 기본은 영어(레딧 수요 조사용).
export type Lang = 'en' | 'ko';
export const LANG_COOKIE = 'tc_lang';

export function toLang(v: string | undefined | null): Lang {
  return v === 'ko' ? 'ko' : 'en';
}

const en = {
  nav: { how: 'How it works', calc: 'Duty-free check', join: 'Join the waitlist', other: '한국어' },
  badge: 'Launching soon · Join the waitlist',
  hero1a: 'Skip the pricey international shipping.',
  hero1b: 'Have a ',
  hero1em: 'traveler',
  hero1c: ' bring it.',
  hero2a: 'Flying anyway? Turn spare luggage space into ',
  hero2em: 'travel money',
  hero2b: '.',
  lead:
    'Buyers post items they can’t get at home. Travelers already heading that way buy them in-store, bring them in their luggage and hand them over. Payment is held until delivery, and duty-free limits and banned items are checked automatically.',
  ctaBuyer: 'Request an item',
  ctaTraveler: 'Earn money while traveling',
  perk: 'Waitlist members get their first order fee-free.',
  howTitle: 'How it works',
  flow: [
    { who: 'buyer', title: 'Post a request', desc: 'Link, quantity and the reward you’ll pay. Banned items and duty-free limits are checked right away.' },
    { who: 'traveler', title: 'Traveler accepts', desc: 'Travelers add their route and dates and see requests that fit.' },
    { who: 'platform', title: 'Escrow payment', desc: 'You pay item + reward + fee. We hold it until you confirm delivery.' },
    { who: 'traveler', title: 'Bought in-store', desc: 'The traveler buys it themselves and uploads the receipt. Never pre-packed parcels.' },
    { who: 'buyer', title: 'Hand-off & payout', desc: 'Delivery photo, you confirm, the traveler gets paid.' },
  ],
  who: { buyer: 'Buyer', traveler: 'Traveler', platform: 'TripCarry' },
  whyTitle: 'Who it’s for',
  why: [
    { eyebrow: 'Buyers', title: 'Cheaper, and things you can’t get at home', items: ['A traveler reward instead of express shipping fees', 'Store-only, limited-edition and hard-to-ship items', 'See estimated duty before you pay'] },
    { eyebrow: 'Travelers', title: 'Spare luggage space pays for your trip', items: ['Only accept requests on routes you’re already flying', 'Small, pricey items pay the best rewards', 'Automatic duty-free checks, no customs surprises'] },
    { eyebrow: 'Everywhere', title: 'A long-tail market travelers connect', items: ['Globetrotters link country A to country B', 'Niche demand that official imports ignore', 'K-beauty, snacks and merch — both directions'] },
  ],
  safetyTitle: 'Built for trust',
  safety: [
    { title: 'Duty-free guard', desc: 'Limits are summed per traveler per trip. Over the limit? Duty is prepaid and declared.' },
    { title: 'Bought in-store only', desc: 'Travelers buy items themselves with a receipt. Carrying sealed parcels for others is banned.' },
    { title: 'Escrow', desc: 'Your money is held until you confirm delivery. No show, full refund.' },
    { title: 'Verified travelers', desc: 'Passport and phone verification, plus two-way reviews.' },
  ],
  calcTitle: 'Duty-free limit check',
  calcSub: 'Try it: where are you flying into, and what’s in the bag?',
  feesTitle: 'Planned fees',
  fees: [
    { big: '5%', label: 'Buyer service fee on the item price (min $2)' },
    { big: '10%', label: 'Taken from the traveler’s reward' },
    { big: '$0', label: 'If no traveler matches, you pay nothing' },
  ],
  finalTitle: 'Would you use this?',
  finalSub: 'We’re checking demand before we launch. Leave your email and tell us what you’d buy or carry — it shapes which routes open first.',
  footer1: 'TripCarry is not live yet. We’re collecting interest before launch.',
  footer2: 'Duty-free limits shown are approximate. Always check official customs guidance before you travel.',
  privacy: 'Privacy',
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
  nav: { how: '이용 방법', calc: '면세 한도 확인', join: '사전 등록하기', other: 'English' },
  badge: '출시 준비 중 · 사전 등록 받는 중',
  hero1a: '비싼 해외 배송비 대신,',
  hero1b: '',
  hero1em: '여행자',
  hero1c: '가 들고 와요.',
  hero2a: '어차피 가는 여행, 남는 캐리어 공간으로 ',
  hero2em: '여행비',
  hero2b: '를 벌어요.',
  lead:
    '구매자는 국내에서 구하기 힘든 물건을 올리고, 그 나라에서 오는 여행자가 매장에서 직접 사서 가져다줘요. 대금은 전달이 끝날 때까지 보관하고, 면세 한도와 반입 금지 품목은 자동으로 확인해요.',
  ctaBuyer: '사고 싶은 물건 요청하기',
  ctaTraveler: '여행하면서 돈 벌기',
  perk: '사전 등록하면 첫 거래 수수료가 무료예요.',
  howTitle: '이용 방법',
  flow: [
    { who: 'buyer', title: '구매 요청 등록', desc: '링크·수량·보상금을 올려요. 금지 품목과 면세 한도를 바로 확인해요.' },
    { who: 'traveler', title: '여행자 수락', desc: '여행자가 경로와 날짜를 올리면 맞는 요청이 보여요.' },
    { who: 'platform', title: '에스크로 결제', desc: '물품비+보상금+수수료를 결제하면 전달 확인 때까지 보관해요.' },
    { who: 'traveler', title: '매장에서 직접 구매', desc: '여행자가 직접 사고 영수증을 올려요. 포장된 남의 짐은 금지예요.' },
    { who: 'buyer', title: '전달 · 정산', desc: '전달 사진을 남기고, 구매자가 확인하면 여행자에게 정산돼요.' },
  ],
  who: { buyer: '구매자', traveler: '여행자', platform: 'TripCarry' },
  whyTitle: '누구에게 좋은가요',
  why: [
    { eyebrow: '구매자', title: '더 싸게, 못 구하던 물건까지', items: ['특송비 대신 여행자 보상금만', '매장 전용·한정판·배송 어려운 물건도', '결제 전에 예상 관세 확인'] },
    { eyebrow: '여행자', title: '남는 캐리어 공간이 여행비로', items: ['이미 가는 경로의 요청만 골라서', '작고 비싼 물건일수록 보상금이 커요', '면세 자동 확인으로 세관 걱정 없음'] },
    { eyebrow: '어디서나', title: '여행자가 잇는 롱테일 시장', items: ['세계 여행자가 A국과 B국을 연결', '정식 수입이 안 되는 소수 취향 수요', 'K-뷰티·과자·굿즈 양방향 수요'] },
  ],
  safetyTitle: '안전장치',
  safety: [
    { title: '면세 자동 가드', desc: '한도를 여행자 한 명·한 여행 기준으로 합산해요. 넘으면 관세를 미리 내고 신고해요.' },
    { title: '매장 직접 구매만', desc: '여행자가 영수증을 받고 직접 산 물건만 운반해요. 포장된 짐 대리 운반은 금지예요.' },
    { title: '에스크로', desc: '수령 확인 전까지 대금을 보관해요. 여행자가 안 오면 전액 환불돼요.' },
    { title: '인증된 여행자', desc: '여권·휴대폰 인증과 상호 평가.' },
  ],
  calcTitle: '면세 한도 확인',
  calcSub: '어느 나라로 들어가고, 가방에 뭘 넣을지 넣어 보세요.',
  feesTitle: '예정 수수료',
  fees: [
    { big: '5%', label: '구매자 서비스 수수료 (물품 금액 기준, 최소 $2)' },
    { big: '10%', label: '여행자 보상금에서 차감' },
    { big: '0원', label: '매칭이 안 되면 아무것도 결제되지 않아요' },
  ],
  finalTitle: '이런 서비스, 쓰실 건가요?',
  finalSub: '출시 전에 수요를 확인하고 있어요. 이메일과 사고 싶은(또는 들고 올 수 있는) 물건을 남겨 주시면 어떤 경로부터 열지 정하는 데 써요.',
  footer1: 'TripCarry는 아직 출시 전이에요. 출시 전에 관심을 모으고 있어요.',
  footer2: '면세 한도는 참고용이에요. 출국 전 각국 세관 공지를 꼭 확인하세요.',
  privacy: '개인정보 처리방침',
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
  'GB', 'FR', 'DE', 'IT', 'ES', 'NL', 'CA', 'MX', 'BR', 'AR', 'AU', 'NZ', 'AE',
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
