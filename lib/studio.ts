// 인스타그램 마케팅 스튜디오: 게시물 데이터 형태, 카드 템플릿 정의, 캡션·해시태그 템플릿.
// 서버(저장)와 브라우저(편집·그리기)에서 함께 쓴다.

export type PostFormat = 'feed' | 'story';
export type PostStatus = 'draft' | 'ready' | 'posted';
export type PostLang = 'ko' | 'en';
export type TemplateId = 'hook' | 'photo' | 'benefits' | 'compare' | 'route' | 'traveler' | 'steps';
export type Theme = 'light' | 'green' | 'dark';

export interface Slide {
  template: TemplateId;
  theme: Theme;
  fields: Record<string, string>;
  /** 사진 템플릿이 배경으로 쓰는 업로드 이미지 id */
  image?: string;
}

/** 마음에 드는 게시물 캡처와 AI가 읽어 둔 스타일 */
export interface RefPost {
  id: string;
  assetId: string;
  note: string;
  style: RefStyle | null;
  createdAt: string;
}

export interface RefStyle {
  summary: string;
  hook: string;
  layout: string;
  tone: string;
  colors: string;
  caption: string;
  theme: Theme;
}

export const ASSET_ID = /^[a-f0-9]{16}$/;

export interface Post {
  id: string;
  /** 추적 링크용 이름 — ?src=ig_<slug> */
  slug: string;
  date: string;
  title: string;
  format: PostFormat;
  lang: PostLang;
  status: PostStatus;
  goal: CaptionGoal;
  slides: Slide[];
  /** 이 게시물에 올린 사진 id */
  photos: string[];
  caption: string;
  hashtags: string;
  createdAt: string;
  updatedAt: string;
}

export interface PostStats {
  visitors: number;
  clicks: number;
  signups: number;
}

export const SIZES: Record<PostFormat, { w: number; h: number; label: string }> = {
  feed: { w: 1080, h: 1350, label: '피드 4:5 (1080×1350)' },
  story: { w: 1080, h: 1920, label: '스토리·릴스 9:16 (1080×1920)' },
};

export const STATUS_LABEL: Record<PostStatus, string> = { draft: '초안', ready: '준비 완료', posted: '게시함' };

export function srcFor(slug: string) {
  return `ig_${slug}`;
}

// ---------- 카드 템플릿 ----------

export interface FieldDef {
  key: string;
  label: string;
  multiline?: boolean;
  ko: string;
  en: string;
}

export interface TemplateDef {
  id: TemplateId;
  name: string;
  desc: string;
  fields: FieldDef[];
}

export const TEMPLATES: TemplateDef[] = [
  {
    id: 'hook',
    name: '한 줄 훅',
    desc: '큰 질문·문장으로 멈추게 하는 표지',
    fields: [
      { key: 'tag', label: '작은 태그', ko: '해외 직구 꿀팁', en: 'Shopping abroad, smarter' },
      { key: 'headline', label: '큰 문장', multiline: true, ko: '파리 약국 크림,\n한국에선 왜 비쌀까?', en: 'Why is Paris pharmacy\nskincare so pricey here?' },
      { key: 'sub', label: '작은 문장', multiline: true, ko: '파리에서 오는 여행자가\n현지 가격으로 들고 와요.', en: 'A traveler flying from Paris\nbrings it at the local price.' },
    ],
  },
  {
    id: 'photo',
    name: '사진 + 문구',
    desc: '올린 사진을 배경에 깔고 글을 얹어요',
    fields: [
      { key: 'tag', label: '작은 태그', ko: '현지에서 바로', en: 'Straight from the store' },
      { key: 'headline', label: '큰 문장', multiline: true, ko: '이 진열대 그대로,\n여행자가 들고 와요', en: 'Straight off this shelf,\ncarried by a traveler' },
      { key: 'sub', label: '작은 문장', multiline: true, ko: '현지 가격 + 작은 보상금이면 끝', en: 'Local price + a small reward' },
    ],
  },
  {
    id: 'benefits',
    name: '3대 이점',
    desc: '없는 물건 · 배송비 0원 · 정가 거품 없이',
    fields: [
      { key: 'title', label: '제목', multiline: true, ko: 'TripCarry로 사면\n좋은 점 3가지', en: '3 reasons to\nlet a traveler bring it' },
      { key: 'b1', label: '이점 1', ko: '국내에 없는 물건', en: 'Not sold at home' },
      { key: 'd1', label: '설명 1', ko: '현지 매장 전용·한정판', en: 'Store-only & limited items' },
      { key: 'b2', label: '이점 2', ko: '국제 배송비 0원', en: 'No international shipping' },
      { key: 'd2', label: '설명 2', ko: '여행자 보상금만 조금', en: 'Just a small traveler reward' },
      { key: 'b3', label: '이점 3', ko: '정가 거품 없이', en: 'Skip the markup' },
      { key: 'd3', label: '설명 3', ko: '수입가 말고 현지가 그대로', en: 'Local price, not import price' },
    ],
  },
  {
    id: 'compare',
    name: '가격 비교',
    desc: '같은 물건 세 가지 구매 방법 막대',
    fields: [
      { key: 'title', label: '제목', multiline: true, ko: '같은 크림,\n어디서 사야 쌀까?', en: 'Same cream.\nWhere is it cheapest?' },
      { key: 'l1', label: '항목 1', ko: '국내 백화점', en: 'Buy at home' },
      { key: 'v1', label: '금액 1 (숫자)', ko: '58000', en: '45' },
      { key: 'l2', label: '항목 2', ko: '해외 직구 (배송비 포함)', en: 'Order online + shipping' },
      { key: 'v2', label: '금액 2 (숫자)', ko: '41000', en: '34' },
      { key: 'l3', label: '항목 3', ko: 'TripCarry', en: 'TripCarry' },
      { key: 'v3', label: '금액 3 (숫자)', ko: '29000', en: '24' },
      { key: 'unit', label: '단위', ko: '원', en: '$' },
      { key: 'note', label: '작은 글씨', ko: '* 예시 금액이에요. 실제 가격은 물건·시기마다 달라요.', en: '* Example prices. Actual prices vary.' },
    ],
  },
  {
    id: 'route',
    name: '노선 소개',
    desc: '출발 → 도착과 대표 물건',
    fields: [
      { key: 'tag', label: '작은 태그', ko: '첫 노선 오픈 예정', en: 'First route opening soon' },
      { key: 'from', label: '출발', ko: '프랑스 · 이탈리아', en: 'France · Italy' },
      { key: 'to', label: '도착', ko: '한국', en: 'Korea' },
      { key: 'items', label: '대표 물건 (쉼표로 구분)', ko: '현지 명품, 약국 화장품, 한정판 굿즈', en: 'Luxury goods, Pharmacy skincare, Limited merch' },
      { key: 'sub', label: '작은 문장', multiline: true, ko: '유럽에서 오는 여행자에게\n부탁하세요.', en: 'Ask a traveler\nflying in from Europe.' },
    ],
  },
  {
    id: 'traveler',
    name: '여행자 모집',
    desc: '캐리어 빈 공간 = 여행비',
    fields: [
      { key: 'tag', label: '작은 태그', ko: '여행 가는 분 모집', en: 'Calling all travelers' },
      { key: 'headline', label: '큰 문장', multiline: true, ko: '캐리어 빈 공간이\n여행비가 돼요', en: 'Your spare luggage space\npays for your trip' },
      { key: 'calc', label: '수익 예시', ko: '보상금 3만 원 × 4건 = 12만 원', en: '$25 reward × 4 requests = $100' },
      { key: 'sub', label: '작은 문장', multiline: true, ko: '가는 길에 매장에서 사서\n전해 주기만 하면 돼요.', en: 'Buy it in-store on your way\nand hand it over.' },
    ],
  },
  {
    id: 'steps',
    name: '이용 방법',
    desc: '3단계 설명',
    fields: [
      { key: 'title', label: '제목', multiline: true, ko: '이렇게 받아요', en: 'How it works' },
      { key: 's1', label: '1단계', ko: '링크 붙이고 보상금 정하기', en: 'Paste a link, set a reward' },
      { key: 's2', label: '2단계', ko: '여행자가 매장에서 구매 · 영수증 인증', en: 'Traveler buys it in-store with a receipt' },
      { key: 's3', label: '3단계', ko: '받고 확인하면 결제 확정', en: 'Receive it, then payment is released' },
    ],
  },
];

export function templateDef(id: TemplateId) {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

export function defaultFields(id: TemplateId, lang: PostLang) {
  const def = templateDef(id);
  return Object.fromEntries(def.fields.map((f) => [f.key, f[lang]]));
}

export function newSlide(id: TemplateId, lang: PostLang, theme: Theme = 'light'): Slide {
  return { template: id, theme, fields: defaultFields(id, lang) };
}

/** 캐러셀 기본 세트: 훅 → 3대 이점 → 가격 비교 → 이용 방법 */
export function starterSlides(goal: CaptionGoal, lang: PostLang): Slide[] {
  if (goal === 'traveler') return [newSlide('traveler', lang, 'green'), newSlide('steps', lang)];
  if (goal === 'route') return [newSlide('route', lang, 'green'), newSlide('benefits', lang), newSlide('steps', lang)];
  if (goal === 'price') return [newSlide('hook', lang, 'dark'), newSlide('compare', lang), newSlide('steps', lang)];
  return [newSlide('hook', lang, 'green'), newSlide('benefits', lang), newSlide('compare', lang), newSlide('steps', lang)];
}

// ---------- 캡션·해시태그 ----------

export type CaptionGoal = 'buyer' | 'price' | 'route' | 'traveler' | 'trust';

export const GOALS: { id: CaptionGoal; label: string }[] = [
  { id: 'buyer', label: '구매자 모으기 (못 구하는 물건)' },
  { id: 'price', label: '가격 비교 (정가 거품)' },
  { id: 'route', label: '노선 소개' },
  { id: 'traveler', label: '여행자 모집' },
  { id: 'trust', label: '안심 포인트 (에스크로·인증)' },
];

type Vars = { route: string; items: string; link: string };

const CAPTIONS: Record<PostLang, Record<CaptionGoal, ((v: Vars) => string)[]>> = {
  ko: {
    buyer: [
      (v) => `한국에선 안 파는 그 물건, 아직 포기 안 하셨죠? 🧳\n\n${v.route} 노선 여행자가 현지 매장에서 직접 사서 들고 와요.\n✔️ 국제 배송비 대신 작은 보상금만\n✔️ 영수증 인증 + 에스크로 결제\n\n지금 사전 등록하면 첫 거래 수수료 무료 🎁\n👉 ${v.link}`,
      (v) => `“이거 한국엔 없나요?” 이제 여행자에게 부탁하세요.\n\n${v.items} — 현지에서만 살 수 있는 물건을 ${v.route} 여행자가 대신 사 와요.\n받고 확인해야 결제가 확정돼서 안심이에요.\n\n사전 등록은 프로필 링크에서 👉 ${v.link}`,
    ],
    price: [
      (v) => `같은 물건인데 왜 한국에선 이렇게 비쌀까요? 💸\n\n수입 유통 마진 + 국제 배송비 + 관세까지.\nTripCarry는 현지 가격 + 여행자 보상금이면 끝이에요.\n\n저장해 두고 다음 직구 전에 비교해 보세요 📌\n사전 등록 👉 ${v.link}`,
      (v) => `정가 거품 빼고 사는 법 🧾\n\n${v.route} 여행자가 현지 매장 가격 그대로 사서 들고 와요.\n면세 한도와 반입 금지 품목은 시스템이 자동으로 확인해요.\n\n첫 거래 수수료 무료 사전 등록 👉 ${v.link}`,
    ],
    route: [
      (v) => `✈️ 첫 노선 오픈 예정: ${v.route}\n\n이런 물건부터 받아 볼 수 있어요\n${v.items.split(/,\s*/).map((x) => `• ${x}`).join('\n')}\n\n원하는 물건을 미리 알려 주시면 그 노선부터 열어요.\n사전 등록 👉 ${v.link}`,
    ],
    traveler: [
      (v) => `여행 가는 길에 여행비 벌어 가세요 ✈️💰\n\n캐리어 빈 공간에 부탁받은 물건을 매장에서 사서 전해 주기만 하면 돼요.\n✔️ 이미 가는 경로의 요청만 골라서\n✔️ 면세 한도 자동 확인으로 세관 걱정 없이\n✔️ 전달 즉시 정산\n\n여행자 사전 등록 👉 ${v.link}`,
      (v) => `${v.route} 자주 오가는 분? 🙋\n\n가방 반쯤 비어 있다면 그 공간이 돈이 돼요.\n작고 비싼 물건일수록 보상금이 커요.\n\n여행자로 먼저 등록해 두세요 👉 ${v.link}`,
    ],
    trust: [
      (v) => `모르는 사람에게 부탁해도 괜찮을까? 🤔\n\nTripCarry는 이렇게 지켜요\n🔒 받고 확인해야 결제 확정 (에스크로)\n🧾 매장에서 물품+영수증 사진 인증\n⏱️ 48시간 안에 인증 없으면 자동 전액 환불\n🚫 금지 품목은 등록 단계에서 자동 차단\n\n자세히 보기 👉 ${v.link}`,
    ],
  },
  en: {
    buyer: [
      (v) => `That thing you can’t get at home? Don’t give up yet 🧳\n\nA traveler on the ${v.route} route buys it in-store and brings it to you.\n✔️ A small reward instead of international shipping\n✔️ Receipt photo + escrow payment\n\nJoin the waitlist — first order fee-free 🎁\n👉 ${v.link}`,
      (v) => `“Is this sold here?” Now you can just ask a traveler.\n\n${v.items} — local-only finds, bought by travelers on the ${v.route} route.\nYou only pay once you’ve received it.\n\nWaitlist link in bio 👉 ${v.link}`,
    ],
    price: [
      (v) => `Why does the same item cost so much more at home? 💸\n\nImport markup + shipping + duty.\nWith TripCarry it’s the local price + a traveler reward.\n\nSave this for your next order 📌\nWaitlist 👉 ${v.link}`,
    ],
    route: [
      (v) => `✈️ First route opening soon: ${v.route}\n\nStarting with\n${v.items.split(/,\s*/).map((x) => `• ${x}`).join('\n')}\n\nTell us what you want and we’ll open that route first.\nWaitlist 👉 ${v.link}`,
    ],
    traveler: [
      (v) => `Earn travel money on a trip you’re taking anyway ✈️💰\n\nBuy a requested item in-store and hand it over — that’s it.\n✔️ Only requests on your route\n✔️ Duty-free limits checked automatically\n✔️ Paid on hand-off\n\nJoin as a traveler 👉 ${v.link}`,
    ],
    trust: [
      (v) => `Is it safe to ask a stranger? 🤔\n\nHow TripCarry protects you\n🔒 Escrow — you pay once you’ve received it\n🧾 In-store item + receipt photo\n⏱️ No proof in 48h = automatic full refund\n🚫 Banned items blocked automatically\n\nLearn more 👉 ${v.link}`,
    ],
  },
};

const TAGS: Record<PostLang, { base: string[]; goal: Record<CaptionGoal, string[]>; route: Record<string, string[]> }> = {
  ko: {
    base: ['#TripCarry', '#트립캐리', '#해외직구', '#직구꿀팁'],
    goal: {
      buyer: ['#한국에없는물건', '#현지템', '#해외쇼핑'],
      price: ['#가격비교', '#알뜰쇼핑', '#정가거품'],
      route: ['#해외여행', '#여행쇼핑'],
      traveler: ['#여행경비', '#여행부업', '#해외여행준비', '#캐리어'],
      trust: ['#안전거래', '#에스크로'],
    },
    route: {
      eu: ['#파리약국', '#프랑스약국화장품', '#유럽쇼핑', '#파리여행', '#이탈리아여행'],
      asia: ['#K뷰티', '#올리브영', '#케이팝굿즈', '#한국화장품'],
    },
  },
  en: {
    base: ['#TripCarry', '#shoppingabroad', '#travelhacks'],
    goal: {
      buyer: ['#cantgetithere', '#localfinds'],
      price: ['#savemoney', '#pricecomparison'],
      route: ['#travel', '#travelshopping'],
      traveler: ['#travelmoney', '#sidehustle', '#digitalnomad', '#carryon'],
      trust: ['#escrow', '#safeshopping'],
    },
    route: {
      eu: ['#parispharmacy', '#frenchpharmacy', '#europeshopping'],
      asia: ['#kbeauty', '#oliveyoung', '#kpopmerch', '#koreanskincare'],
    },
  },
};

export const ROUTE_PRESETS = [
  { id: 'eu', ko: '유럽 → 한국', en: 'Europe → Korea', itemsKo: '현지 명품, 약국 화장품, 한정판 굿즈', itemsEn: 'Luxury goods, Pharmacy skincare, Limited merch' },
  { id: 'asia', ko: '한국 → 중국·동남아·중동', en: 'Korea → China · SE Asia · Middle East', itemsKo: 'K-뷰티, K-POP 한정 굿즈, 건강기능식품', itemsEn: 'K-beauty, K-pop exclusive merch, Health supplements' },
];

export function makeCaption(goal: CaptionGoal, lang: PostLang, routeId: string, link: string, variant: number) {
  const r = ROUTE_PRESETS.find((x) => x.id === routeId) ?? ROUTE_PRESETS[0];
  const list = CAPTIONS[lang][goal];
  const fn = list[((variant % list.length) + list.length) % list.length];
  return fn({ route: lang === 'ko' ? r.ko : r.en, items: lang === 'ko' ? r.itemsKo : r.itemsEn, link });
}

export function makeHashtags(goal: CaptionGoal, lang: PostLang, routeId: string) {
  const t = TAGS[lang];
  return [...t.base, ...t.goal[goal], ...(t.route[routeId] ?? [])].join(' ');
}

export function captionVariants(goal: CaptionGoal, lang: PostLang) {
  return CAPTIONS[lang][goal].length;
}
