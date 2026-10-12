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
      { key: 'tag', label: '작은 태그', ko: '도쿄 한정품', en: 'Tokyo exclusives' },
      { key: 'headline', label: '큰 문장', multiline: true, ko: '포켓몬센터 한정 굿즈,\n한국에선 왜 못 살까?', en: 'Tokyo store-only goods —\nwhy can’t you buy them here?' },
      { key: 'sub', label: '작은 문장', multiline: true, ko: '도쿄 사는 사람이 매장 정가로 사 와요.\n웃돈 대신 수고비만.', en: 'Someone who lives in Tokyo buys it at retail.\nA carry fee, not a resale markup.' },
    ],
  },
  {
    id: 'photo',
    name: '사진 + 문구',
    desc: '올린 사진을 배경에 깔고 글을 얹어요 (직접 찍은 사진만)',
    fields: [
      { key: 'tag', label: '작은 태그', ko: '도쿄 매장에서 바로', en: 'Straight from a Tokyo store' },
      { key: 'headline', label: '큰 문장', multiline: true, ko: '이 진열대 그대로,\n귀국길에 들고 와요', en: 'Straight off this shelf,\ncarried home to Seoul' },
      { key: 'sub', label: '작은 문장', multiline: true, ko: '매장 정가 + 수고비면 끝', en: 'Retail price + a carry fee' },
    ],
  },
  {
    id: 'benefits',
    name: '3가지 차이',
    desc: '온라인에 없는 물건 · 웃돈 대신 수고비 · 떼일 걱정 없이',
    fields: [
      { key: 'title', label: '제목', multiline: true, ko: 'TripCarry가\n다른 점 3가지', en: '3 things that make\nTripCarry different' },
      { key: 'b1', label: '이점 1', ko: '온라인에 없는 물건', en: 'Not sold online' },
      { key: 'd1', label: '설명 1', ko: '매장·파크·시즌 한정 굿즈', en: 'Store, park & seasonal exclusives' },
      { key: 'b2', label: '이점 2', ko: '웃돈 대신 수고비', en: 'A carry fee, not a markup' },
      { key: 'd2', label: '설명 2', ko: '리셀가 말고 매장 정가 + 수고비', en: 'Retail price + a carry fee' },
      { key: 'b3', label: '이점 3', ko: '떼일 걱정 없이', en: 'No getting scammed' },
      { key: 'd3', label: '설명 3', ko: '안전결제 + 매장 영수증 인증', en: 'Escrow + in-store receipt photo' },
    ],
  },
  {
    id: 'compare',
    name: '가격 비교',
    desc: '정가 100 기준으로 사는 방법 비교 (예시)',
    fields: [
      { key: 'title', label: '제목', multiline: true, ko: '정가 100짜리 한정 굿즈,\n얼마에 사게 될까?', en: 'Retail price = 100.\nWhat do you end up paying?' },
      { key: 'l1', label: '항목 1', ko: '리셀 앱 (정가 + 웃돈)', en: 'Resale app (retail + markup)' },
      { key: 'v1', label: '값 1 (숫자)', ko: '160', en: '160' },
      { key: 'l2', label: '항목 2', ko: '개인 구매대행 (정가 + 대행비)', en: 'Personal proxy (retail + fee)' },
      { key: 'v2', label: '값 2 (숫자)', ko: '125', en: '125' },
      { key: 'l3', label: '항목 3', ko: 'TripCarry (정가 + 수고비)', en: 'TripCarry (retail + carry fee)' },
      { key: 'v3', label: '값 3 (숫자)', ko: '114', en: '114' },
      { key: 'unit', label: '단위 (%, 원, $)', ko: '%', en: '%' },
      { key: 'note', label: '작은 글씨', ko: '* 정가를 100으로 둔 예시예요. 리셀 웃돈·대행비는 물건과 셀러마다 달라요.', en: '* Example with retail = 100. Markups and proxy fees vary.' },
    ],
  },
  {
    id: 'route',
    name: '노선 소개',
    desc: '출발 → 도착과 대표 물건',
    fields: [
      { key: 'tag', label: '작은 태그', ko: '첫 노선 오픈 준비 중', en: 'First route opening soon' },
      { key: 'from', label: '출발', ko: '도쿄', en: 'Tokyo' },
      { key: 'to', label: '도착', ko: '서울', en: 'Seoul' },
      { key: 'items', label: '대표 물건 (쉼표로 구분)', ko: '포켓몬센터 한정, 디즈니 파크 굿즈, 가챠·이치방쿠지', en: 'Pokémon Center exclusives, Disney park goods, Gacha & Ichiban Kuji' },
      { key: 'sub', label: '작은 문장', multiline: true, ko: '도쿄 사는 한국인이\n귀국길에 들고 와요.', en: 'People living in Tokyo\nbring it on their way home.' },
    ],
  },
  {
    id: 'traveler',
    name: '공급자 모집',
    desc: '도쿄 거주자 · 자주 오가는 사람 모집',
    fields: [
      { key: 'tag', label: '작은 태그', ko: '도쿄 사는 분 모집', en: 'Live in Tokyo?' },
      { key: 'headline', label: '큰 문장', multiline: true, ko: '어차피 가는 귀국길,\n짐 칸으로 비행기 값', en: 'Flying home anyway?\nLet your spare kg pay for it' },
      { key: 'calc', label: '강조 한 줄', ko: '내 일정에 맞는 요청만 · 여유 kg 안에서만', en: 'Only requests on your dates · within your spare kg' },
      { key: 'sub', label: '작은 문장', multiline: true, ko: '매장에서 사고 영수증만 올리면 돼요.\n물건값 먼저 정산도 준비 중이에요.', en: 'Buy it in store and upload the receipt.\nPaying item costs back first is in the works.' },
    ],
  },
  {
    id: 'steps',
    name: '이용 방법',
    desc: '3단계 설명',
    fields: [
      { key: 'title', label: '제목', multiline: true, ko: '이렇게 받아요', en: 'How it works' },
      { key: 's1', label: '1단계', ko: '원하는 물건·날짜·수고비 정하기', en: 'Pick the item, date and carry fee' },
      { key: 's2', label: '2단계', ko: '도쿄 매장에서 구매 · 영수증 사진 인증', en: 'Bought in a Tokyo store with a receipt photo' },
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

export function newSlide(id: TemplateId, lang: PostLang, theme: Theme = 'light', fields: Record<string, string> = {}): Slide {
  return { template: id, theme, fields: { ...defaultFields(id, lang), ...fields } };
}

// 목적별로 기본 문구를 바꿔 쓰는 카드 (템플릿은 같고 글만 다르다)
const PRESET_FIELDS: Record<PostLang, Record<string, Record<string, string>>> = {
  ko: {
    supplySteps: { title: '공급자는 이렇게 해요', s1: '귀국 일정 올리고 맞는 요청 고르기', s2: '매장에서 사고 영수증 사진 올리기', s3: '전달하면 수고비 정산' },
    trustHook: { tag: '구매대행 먹튀, 이제 그만', headline: '선입금 보냈다가\n연락 끊긴 적 있나요?', sub: '돈은 TripCarry가 보관하고,\n받고 확인해야 결제가 확정돼요.' },
    priceHook: { tag: '리셀가 대신', headline: '웃돈 대신,\n수고비만', sub: '도쿄 매장 정가로 사 오고\n수고비만 내요.' },
  },
  en: {
    supplySteps: { title: 'How carrying works', s1: 'Add your trip home and pick matching requests', s2: 'Buy in store and upload the receipt photo', s3: 'Hand it over and get your carry fee' },
    trustHook: { tag: 'No more proxy scams', headline: 'Ever paid upfront\nand never heard back?', sub: 'We hold the money until\nyou confirm you got it.' },
    priceHook: { tag: 'Instead of resale', headline: 'A carry fee,\nnot a markup', sub: 'Bought at Tokyo retail —\nyou only add a carry fee.' },
  },
};

/** 목적별 캐러셀 기본 세트 */
export function starterSlides(goal: CaptionGoal, lang: PostLang): Slide[] {
  const P = PRESET_FIELDS[lang];
  if (goal === 'traveler') return [newSlide('traveler', lang, 'green'), newSlide('steps', lang, 'light', P.supplySteps)];
  if (goal === 'route') return [newSlide('route', lang, 'green'), newSlide('benefits', lang), newSlide('steps', lang)];
  if (goal === 'price') return [newSlide('hook', lang, 'dark', P.priceHook), newSlide('compare', lang), newSlide('steps', lang)];
  if (goal === 'trust') return [newSlide('hook', lang, 'dark', P.trustHook), newSlide('benefits', lang), newSlide('steps', lang)];
  return [newSlide('hook', lang, 'green'), newSlide('benefits', lang), newSlide('compare', lang), newSlide('steps', lang)];
}

// ---------- 캡션·해시태그 ----------

export type CaptionGoal = 'buyer' | 'price' | 'route' | 'traveler' | 'trust';

export const GOALS: { id: CaptionGoal; label: string }[] = [
  { id: 'buyer', label: '구매자 모으기 (못 구하는 도쿄 한정품)' },
  { id: 'price', label: '웃돈 대신 수고비 (리셀가 비교)' },
  { id: 'route', label: '도쿄 노선 소개' },
  { id: 'traveler', label: '공급자 모집 (도쿄 거주자)' },
  { id: 'trust', label: '먹튀 걱정 없이 (안전결제·영수증)' },
];

type Vars = { route: string; items: string; link: string };

const CAPTIONS: Record<PostLang, Record<CaptionGoal, ((v: Vars) => string)[]>> = {
  ko: {
    buyer: [
      (v) => `포켓몬센터, 디즈니 파크, 매장 한정품… 온라인으로는 못 사서 리셀가로 사신 적 있나요? 🧸\n\n도쿄에 사는 한국인이 귀국길에 매장 정가로 사다 주는 서비스를 준비하고 있어요. 웃돈 대신 수고비만 내요.\n✔️ 돈은 안전결제로 보관\n✔️ 매장 영수증 사진으로 확인\n\n원하는 물건을 댓글로 남겨 주세요. 많이 요청된 물건부터 열어요 🙌\n사전 등록하면 첫 거래 수수료 무료 → ${v.link}`,
      (v) => `“이거 한국엔 없나요?” 🇯🇵\n\n${v.items} — 도쿄에서만 살 수 있는 물건을 도쿄 사는 사람이 대신 사 와요.\n받고 확인해야 결제가 확정돼서 안심이에요.\n\n사전 등록은 ${v.link}`,
    ],
    price: [
      (v) => `리셀가 보고 장바구니 닫은 적 있죠? 💸\n\n한정 굿즈는 온라인에 없어서 결국 웃돈 주고 사게 돼요.\nTripCarry는 도쿄 매장 정가에 수고비만 더해요.\n급한 물건은 수고비를 올리면 더 빨리 와요.\n\n저장해 두고 다음 한정판 때 비교해 보세요 📌\n사전 등록 → ${v.link}`,
      (v) => `웃돈 대신, 수고비만 🧾\n\n${v.route} — 도쿄 사는 사람이 매장에서 정가로 사고, 영수증 사진으로 확인해요.\n구매자 플랫폼 수수료는 없어요.\n\n첫 거래 수수료 무료 사전 등록 → ${v.link}`,
    ],
    route: [
      (v) => `✈️ 첫 노선 오픈 준비 중: ${v.route}\n\n이런 물건부터 받아 볼 수 있어요\n${v.items.split(/,\s*/).map((x) => `• ${x}`).join('\n')}\n\n원하는 물건을 댓글로 알려 주시면 그것부터 열어요.\n사전 등록 → ${v.link}`,
    ],
    traveler: [
      (v) => `도쿄에 살거나 자주 오가는 분들을 찾고 있어요 ✈️\n\n한국에서 도쿄 매장 한정품을 원하는 분들과 연결해 드려요.\n✔️ 귀국 일정에 맞는 요청만 골라서\n✔️ 짐 여유 안에서, 작고 가벼운 물건 위주로\n✔️ 영수증이 확인되면 물건값부터 정산하는 방식도 준비 중\n\n출시 전이라 지금 등록해 주시는 분들 의견으로 방식을 정하고 있어요.\n"도쿄 살아요 · 부수입 벌기" → ${v.link}`,
      (v) => `어차피 가는 귀국길, 캐리어 남는 칸 있으시죠? 🙋\n\n그 공간으로 비행기 값을 벌 수 있어요. 도쿄 매장에서 사고, 한국에서 전해 주기만 하면 돼요.\n\n공급자로 먼저 등록해 두세요 → ${v.link}`,
    ],
    trust: [
      (v) => `구매대행 선입금 보냈다가 연락 끊긴 적 있나요? 😰\n\nTripCarry는 이렇게 지켜요\n🔒 돈은 TripCarry가 보관, 받고 확인해야 결제 확정\n🧾 매장에서 물건 + 영수증 사진 인증\n⏱️ 48시간 안에 인증이 없으면 자동 전액 환불\n🚫 주류·담배·의약품 등 금지 품목은 자동 차단\n\n자세히 보기 → ${v.link}`,
    ],
  },
  en: {
    buyer: [
      (v) => `Tokyo store-only goods you can’t buy online? 🧸\n\nPeople living in Tokyo pick them up at retail on their way home to Seoul. You pay a carry fee, not a resale markup.\n✔️ Escrow payment\n✔️ In-store receipt photo\n\nTell us what you want in the comments — the most requested items open first.\nJoin the waitlist → ${v.link}`,
      (v) => `“Is this sold in Korea?” 🇯🇵\n\n${v.items} — bought in Tokyo stores by people who live there.\nYou only pay once you’ve received it.\n\nWaitlist → ${v.link}`,
    ],
    price: [
      (v) => `Closed the tab after seeing the resale price? 💸\n\nStore exclusives aren’t sold online, so you end up paying a markup.\nWith TripCarry it’s Tokyo retail + a carry fee. Raise the fee for faster matches.\n\nSave this for the next drop 📌\nWaitlist → ${v.link}`,
    ],
    route: [
      (v) => `✈️ First route opening soon: ${v.route}\n\nStarting with\n${v.items.split(/,\s*/).map((x) => `• ${x}`).join('\n')}\n\nTell us what you want and we’ll open it first.\nWaitlist → ${v.link}`,
    ],
    traveler: [
      (v) => `Live in Tokyo or fly home to Korea often? ✈️\n\nTurn spare luggage space into ticket money.\n✔️ Only requests that fit your dates\n✔️ Small, light items within your spare kg\n✔️ Paying item costs back on receipt is in the works\n\nJoin as a carrier → ${v.link}`,
    ],
    trust: [
      (v) => `Ever paid a proxy upfront and never heard back? 😰\n\nHow TripCarry protects you\n🔒 We hold the money until you confirm delivery\n🧾 In-store item + receipt photo\n⏱️ No proof in 48h = automatic full refund\n🚫 Alcohol, tobacco and medicines blocked\n\nLearn more → ${v.link}`,
    ],
  },
};

const TAGS: Record<PostLang, { base: string[]; goal: Record<CaptionGoal, string[]>; route: Record<string, string[]> }> = {
  ko: {
    base: ['#TripCarry', '#트립캐리', '#도쿄한정', '#일본한정'],
    goal: {
      buyer: ['#대리구매', '#일본굿즈', '#한정판굿즈'],
      price: ['#리셀', '#웃돈', '#정가구매'],
      route: ['#도쿄여행', '#일본여행'],
      traveler: ['#도쿄생활', '#일본유학', '#일본워홀', '#재일한국인', '#부수입'],
      trust: ['#안전거래', '#구매대행', '#먹튀방지'],
    },
    route: {
      tokyo: ['#포켓몬센터', '#도쿄디즈니', '#가챠', '#이치방쿠지', '#산리오'],
      'seoul-tokyo': ['#올리브영', '#K뷰티', '#케이팝굿즈'],
    },
  },
  en: {
    base: ['#TripCarry', '#tokyoexclusive', '#japanexclusive'],
    goal: {
      buyer: ['#japanmerch', '#limitededition'],
      price: ['#resale', '#retailprice'],
      route: ['#tokyo', '#seoul'],
      traveler: ['#tokyolife', '#livinginjapan', '#sidehustle'],
      trust: ['#safeshopping', '#escrow'],
    },
    route: {
      tokyo: ['#pokemoncenter', '#tokyodisney', '#gachapon', '#ichibankuji', '#sanrio'],
      'seoul-tokyo': ['#oliveyoung', '#kbeauty', '#kpopmerch'],
    },
  },
};

export const ROUTE_PRESETS = [
  { id: 'tokyo', ko: '도쿄 → 서울', en: 'Tokyo → Seoul', itemsKo: '포켓몬센터 한정 굿즈, 도쿄 디즈니 파크 굿즈, 가챠·이치방쿠지, 산리오 매장 한정', itemsEn: 'Pokémon Center exclusives, Tokyo Disney park goods, Gacha & Ichiban Kuji, Sanrio store exclusives' },
  { id: 'seoul-tokyo', ko: '서울 → 도쿄 (2단계)', en: 'Seoul → Tokyo (phase 2)', itemsKo: '올리브영 단독 상품, K-POP 앨범·굿즈', itemsEn: 'Olive Young exclusives, K-pop albums & merch' },
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

// ---------- 2주 게시 계획 (마케팅 플레이북 E~H 단계와 같은 순서) ----------

export const PLAN_2W: { day: number; goal: CaptionGoal; variant: number; title: string }[] = [
  { day: 0, goal: 'buyer', variant: 0, title: '① 한국에선 왜 못 살까 (구매자)' },
  { day: 1, goal: 'price', variant: 0, title: '② 웃돈 대신 수고비 (가격)' },
  { day: 2, goal: 'traveler', variant: 0, title: '③ 도쿄 사세요? (공급자 모집)' },
  { day: 4, goal: 'trust', variant: 0, title: '④ 먹튀 걱정 없이 (안심)' },
  { day: 6, goal: 'route', variant: 0, title: '⑤ 첫 노선 도쿄 → 서울' },
  { day: 8, goal: 'buyer', variant: 1, title: '⑥ 이거 한국엔 없나요? (구매자)' },
  { day: 10, goal: 'price', variant: 1, title: '⑦ 정가 + 수고비 (가격)' },
  { day: 12, goal: 'traveler', variant: 1, title: '⑧ 귀국길 짐 칸 (공급자 모집)' },
];
