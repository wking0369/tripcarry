// 랜딩·한정품·사전 등록 화면 문구. 첫 노선은 도쿄 → 서울이라 한국어가 기본이고,
// 브라우저 언어가 영어·일본어면 그 언어로 시작한다.
// 일본어 방문자는 반대 방향(서울 → 도쿄)의 구매자라서 일본어 랜딩은 그 방향으로 쓴다 (2단계 수요 측정용).
// 일본어는 랜딩·한정품·사전 등록까지만 있고, 약관·규칙·도움말 같은 긴 문서는 영어로 보여 준다 (docLang).
export type Lang = 'ko' | 'en' | 'ja';
export type DocLang = 'ko' | 'en';
export const LANGS: Lang[] = ['ko', 'en', 'ja'];
export const LANG_COOKIE = 'tc_lang';
export const LANG_LABEL: Record<Lang, string> = { ko: '한국어', en: 'EN', ja: '日本語' };

export function isLang(v: unknown): v is Lang {
  return v === 'ko' || v === 'en' || v === 'ja';
}

/** 쿠키가 있으면 그 값, 없으면 브라우저 언어(Accept-Language)의 첫 지원 언어, 그것도 없으면 한국어 */
export function pickLang(cookie: string | undefined | null, accept: string | undefined | null): Lang {
  if (isLang(cookie)) return cookie;
  for (const part of (accept || '').split(',')) {
    const code = part.trim().slice(0, 2).toLowerCase();
    if (isLang(code)) return code;
  }
  return 'ko';
}

export function docLang(l: Lang): DocLang {
  return l === 'ko' ? 'ko' : 'en';
}

export type RouteKey = 'JP-KR' | 'KR-JP' | 'other';
export const ROUTE_CODES: Record<Exclude<RouteKey, 'other'>, { from: string; to: string }> = {
  'JP-KR': { from: 'JP', to: 'KR' },
  'KR-JP': { from: 'KR', to: 'JP' },
};
/** 언어별 기본 방향: 일본어 방문자는 서울 → 도쿄 구매자 */
export const DEFAULT_ROUTE: Record<Lang, RouteKey> = { ko: 'JP-KR', en: 'JP-KR', ja: 'KR-JP' };

const ko = {
  nav: { join: '사전 등록', drops: '도쿄 한정품' },
  badge: '도쿄 → 서울 · 출시 준비 중',
  h1a: '도쿄 매장에서만 파는 물건,',
  h1b: '도쿄 사는 사람이 가져다줘요.',
  sub: '온라인으로는 못 사는 한정품을, 도쿄에 사는 한국인이 귀국길에 매장 정가로 사 와요.',
  ctaBuyer: '원하는 물건 요청하기',
  ctaTraveler: '도쿄 살아요 · 부수입 벌기',
  perk: '사전 등록하면 첫 거래 수수료 무료',
  dropsTitle: '이런 물건을 가져와요',
  dropsSub: '온라인 판매가 없거나 한국으로 배송되지 않는 매장·파크·시즌 한정품',
  dropsAll: '한정품 전체 보기 →',
  dropsSample: '예시 품목이에요. 실제 취급 품목과 가격은 출시 때 확인해서 알려 드려요.',
  want: '이거 원해요',
  wanted: '✓ 담았어요',
  notListed: '목록에 없나요?',
  notListedSub: '원하는 도쿄 물건을 알려 주세요. 많이 요청된 물건부터 열어요.',
  notListedCta: '직접 요청하기',
  compareTitle: '리셀가 말고, 매장 정가로',
  compareNote: '예시예요. 리셀 웃돈은 품목마다 다르고, TripCarry 비용(보상금 10% + 수수료)은 정가 $100 이상 기준이에요.',
  compare: [
    { label: '리셀 앱에서 사면', note: '정가 + 리셀 웃돈', value: 160, shown: '정가 + 웃돈' },
    { label: '구매대행·직구', note: '매장 한정품은 온라인에 없어요', value: 0, shown: '구매 불가' },
    { label: 'TripCarry', note: '매장 정가 + 보상금 + 수수료', value: 118, shown: '정가 + 약 18%', best: true },
  ],
  stepsTitle: '이용 방법',
  steps: [
    { title: '요청', desc: '원하는 물건과 날짜를 알려 주세요' },
    { title: '도쿄에서 구매', desc: '매장에서 정가로 사고 영수증 사진 첨부' },
    { title: '받고 확인', desc: '택배나 직접 수령 · 확인해야 결제 확정' },
  ],
  trust: ['안전결제(에스크로)', '매장 구매 영수증 사진', '문제 생기면 TripCarry가 먼저 환불', '면세 한도 안의 물건만'],
  supplyTitle: '도쿄에 살거나 자주 오가세요?',
  supplySub: '어차피 가는 귀국길, 남는 짐 칸으로 비행기 값을 벌어요.',
  supply: [
    { icon: 'plane', title: '가는 길에만', desc: '내 일정에 맞는 요청만 골라요' },
    { icon: 'bag', title: '여유 kg 안에서', desc: '작고 가벼운 물건 위주' },
    { icon: 'coin', title: '물건값 먼저 지급', desc: '영수증이 확인되면 바로' },
  ],
  supplyCta: '공급자로 사전 등록',
  finalTitle: '이런 서비스, 쓰실 건가요?',
  finalSub: '원하는 물건이나 가져다줄 수 있는 날짜를 알려 주세요. 무엇부터 열지 정하는 데 써요.',
  footer1: 'TripCarry는 아직 출시 전이에요. 출시 전에 관심을 모으고 있어요.',
  footer2: '브랜드·매장 이름은 설명을 위한 것이며, TripCarry는 해당 브랜드와 제휴하지 않았어요. 면세 한도는 참고용이에요.',
  terms: '이용약관',
  rules: '구매 전 확인',
  help: '도움말',
  privacy: '개인정보 처리방침',
  calc: '면세 한도 계산기',
  preview: '동작하는 미리보기 (샘플 데이터)',
  badges: { store: '매장 한정', park: '파크 전용', season: '시즌 한정', lottery: '현장 추첨' },
  modal: {
    title: '사전 등록',
    sub: '도쿄 → 서울부터 열어요. 사전 등록하면 첫 거래 수수료가 무료예요.',
    email: '이메일',
    role: '저는…',
    roles: { buyer: '물건을 받고 싶어요', traveler: '가져다줄 수 있어요', both: '둘 다' },
    route: '어느 방향인가요?',
    routes: { 'JP-KR': '도쿄 → 서울', 'KR-JP': '서울 → 도쿄', other: '다른 도시' },
    from: '구매 국가',
    to: '받을 국가',
    item: '원하는 물건',
    itemPh: '예: 포켓몬센터 한정 인형, 크롬하츠 후드',
    pay: '건당 낼 수 있는 보상금 (USD)',
    payPh: '예: 15',
    supplyHead: '가져다주는 분께 몇 가지만 여쭤볼게요',
    kind: '어떤 분이세요?',
    kinds: { resident: '현지 거주', student: '유학생', business: '출장이 잦아요', traveler: '여행' },
    trips: '1년에 몇 번 오가세요?',
    tripsOpts: { '1-2': '1~2번', '3-5': '3~5번', '6-11': '6~11번', '12+': '12번 이상' },
    kg: '보통 짐에 여유가 얼마나 있어요?',
    kgOpts: { '1': '1kg 이하', '1-3': '1~3kg', '3-5': '3~5kg', '5+': '5kg 이상' },
    minPay: '건당 최소 얼마면 하시겠어요? (USD)',
    minPayPh: '예: 20',
    optional: '선택',
    submit: '사전 등록하기',
    sending: '등록 중…',
    consent: '출시 소식만 보내요. 언제든 수신을 거부할 수 있어요.',
    doneTitle: '등록됐어요!',
    doneSub: '노선이 열리면 메일로 알려 드릴게요. 첫 거래 수수료는 무료예요.',
    share: '도쿄에 사는 친구가 있다면 이 페이지를 공유해 주세요.',
    close: '닫기',
    pick: '선택',
    errorGeneric: '문제가 생겼어요. 다시 시도해 주세요.',
    errorEmail: '이메일 주소를 확인해 주세요.',
    errorBusy: '시도가 너무 많아요. 1분 뒤에 다시 해 주세요.',
  },
};

type Dict = typeof ko;

const en: Dict = {
  nav: { join: 'Join the waitlist', drops: 'Tokyo exclusives' },
  badge: 'Tokyo → Seoul · Launching soon',
  h1a: 'Sold only in Tokyo stores.',
  h1b: 'Someone who lives there brings it.',
  sub: 'Store-only items you can’t buy online, picked up at retail price by people living in Tokyo on their way home to Seoul.',
  ctaBuyer: 'Request an item',
  ctaTraveler: 'I live in Tokyo — earn extra',
  perk: 'Waitlist = first order fee-free',
  dropsTitle: 'The kind of things we bring',
  dropsSub: 'Store, park and seasonal exclusives that aren’t sold online or don’t ship to Korea',
  dropsAll: 'See all exclusives →',
  dropsSample: 'Sample items. Actual items and prices will be confirmed at launch.',
  want: 'I want this',
  wanted: '✓ Saved',
  notListed: 'Not on the list?',
  notListedSub: 'Tell us what you want from Tokyo. The most requested items open first.',
  notListedCta: 'Request it',
  compareTitle: 'Pay retail, not resale',
  compareNote: 'Illustrative. Resale markups vary by item; TripCarry cost (10% reward + fees) assumes a retail price of $100+.',
  compare: [
    { label: 'Resale apps', note: 'Retail + resale markup', value: 160, shown: 'Retail + markup' },
    { label: 'Proxy / online', note: 'Store exclusives aren’t online', value: 0, shown: 'Not available' },
    { label: 'TripCarry', note: 'Retail + reward + fees', value: 118, shown: 'Retail + ~18%', best: true },
  ],
  stepsTitle: 'How it works',
  steps: [
    { title: 'Request', desc: 'Tell us the item and when you need it' },
    { title: 'Bought in Tokyo', desc: 'At retail, in store, with a receipt photo' },
    { title: 'Receive & confirm', desc: 'Parcel or hand-off — paid out only then' },
  ],
  trust: ['Escrow payment', 'In-store receipt photo', 'We refund first if something goes wrong', 'Within duty-free limits only'],
  supplyTitle: 'Live in Tokyo or fly there often?',
  supplySub: 'You’re flying home anyway. Turn spare luggage space into ticket money.',
  supply: [
    { icon: 'plane', title: 'Only on your way', desc: 'Pick requests that fit your trip' },
    { icon: 'bag', title: 'Within your spare kg', desc: 'Mostly small, light items' },
    { icon: 'coin', title: 'Item cost paid first', desc: 'As soon as the receipt checks out' },
  ],
  supplyCta: 'Join as a carrier',
  finalTitle: 'Would you use this?',
  finalSub: 'Tell us what you want, or when you could carry. It decides what opens first.',
  footer1: 'TripCarry is not live yet. We’re collecting interest before launch.',
  footer2: 'Brand and store names are for illustration only; TripCarry is not affiliated with them. Duty-free limits are approximate.',
  terms: 'Terms',
  rules: 'Before you buy',
  help: 'Help',
  privacy: 'Privacy',
  calc: 'Duty-free calculator',
  preview: 'Interactive preview (sample data, Korean)',
  badges: { store: 'Store only', park: 'Park only', season: 'Seasonal', lottery: 'In-store draw' },
  modal: {
    title: 'Get early access',
    sub: 'Opening Tokyo → Seoul first. Join the waitlist and your first order is fee-free.',
    email: 'Email',
    role: 'I want to…',
    roles: { buyer: 'Get items', traveler: 'Carry items', both: 'Both' },
    route: 'Which direction?',
    routes: { 'JP-KR': 'Tokyo → Seoul', 'KR-JP': 'Seoul → Tokyo', other: 'Another city' },
    from: 'From (buy in)',
    to: 'To (deliver to)',
    item: 'What do you want?',
    itemPh: 'e.g. Pokémon Center exclusive plush, Chrome Hearts hoodie',
    pay: 'Reward you’d pay per order (USD)',
    payPh: 'e.g. 15',
    supplyHead: 'A few quick questions for carriers',
    kind: 'Which fits you?',
    kinds: { resident: 'Live there', student: 'Student', business: 'Frequent business trips', traveler: 'Traveler' },
    trips: 'Round trips per year?',
    tripsOpts: { '1-2': '1–2', '3-5': '3–5', '6-11': '6–11', '12+': '12+' },
    kg: 'Spare luggage space, usually?',
    kgOpts: { '1': 'Under 1 kg', '1-3': '1–3 kg', '3-5': '3–5 kg', '5+': '5 kg+' },
    minPay: 'Minimum reward per order you’d accept (USD)',
    minPayPh: 'e.g. 20',
    optional: 'optional',
    submit: 'Join the waitlist',
    sending: 'Joining…',
    consent: 'We’ll only email you about the launch. Unsubscribe anytime.',
    doneTitle: 'You’re on the list!',
    doneSub: 'We’ll email you when your route opens. Your first order will be fee-free.',
    share: 'Know someone who lives in Tokyo? Share this page with them.',
    close: 'Close',
    pick: 'Select',
    errorGeneric: 'Something went wrong. Please try again.',
    errorEmail: 'Please enter a valid email.',
    errorBusy: 'Too many tries. Please wait a minute and try again.',
  },
};

const ja: Dict = {
  nav: { join: '事前登録', drops: '東京限定品' },
  badge: 'ソウル → 東京 · 準備中',
  h1a: 'ソウルの店舗でしか買えない物を、',
  h1b: '韓国に住む人が届けます。',
  sub: 'オンラインでは買えない韓国の限定品を、韓国に住む人が日本へ帰るついでに店頭の定価で買ってきます。',
  ctaBuyer: 'ほしい物をリクエスト',
  ctaTraveler: '韓国在住です · 副収入を得る',
  perk: '事前登録で初回の手数料が無料',
  dropsTitle: '東京からソウルへ届ける物',
  dropsSub: 'オンライン販売がない、または韓国へ発送されない店舗・パーク・季節限定品',
  dropsAll: 'すべて見る →',
  dropsSample: 'サンプルです。実際の取扱品と価格はサービス開始時にお知らせします。',
  want: 'これがほしい',
  wanted: '✓ 保存しました',
  notListed: 'ほしい韓国の物は？',
  notListedSub: 'オリーブヤング限定コスメ、K-POPの特典など、ほしい物を教えてください。リクエストの多いものから始めます。',
  notListedCta: 'リクエストする',
  compareTitle: '転売価格ではなく、店頭の定価で',
  compareNote: '例です。転売のプレミアは商品によって異なります。TripCarryの費用（謝礼10%＋手数料）は定価$100以上の場合です。',
  compare: [
    { label: 'フリマ・転売で買う', note: '定価＋プレミア', value: 160, shown: '定価＋プレミア' },
    { label: '代行・通販', note: '店舗限定品はオンラインにありません', value: 0, shown: '購入不可' },
    { label: 'TripCarry', note: '店頭の定価＋謝礼＋手数料', value: 118, shown: '定価＋約18%', best: true },
  ],
  stepsTitle: 'ご利用の流れ',
  steps: [
    { title: 'リクエスト', desc: 'ほしい物と希望日を入力' },
    { title: '店舗で購入', desc: '定価で購入し、レシートの写真を添付' },
    { title: '受け取って確認', desc: '配送または手渡し · 確認後に支払い確定' },
  ],
  trust: ['エスクロー決済', '店舗レシートの写真', '問題があればTripCarryが先に返金', '免税範囲内の品物のみ'],
  supplyTitle: '韓国に住んでいる、またはよく行き来しますか？',
  supplySub: 'どうせ乗る帰りの便。空いている荷物スペースで航空券代を稼げます。',
  supply: [
    { icon: 'plane', title: 'ついでの時だけ', desc: '自分の予定に合う依頼だけ選べます' },
    { icon: 'bag', title: '空き容量の範囲で', desc: '小さくて軽い物が中心です' },
    { icon: 'coin', title: '商品代は先にお支払い', desc: 'レシートの確認後すぐに' },
  ],
  supplyCta: '運び手として事前登録',
  finalTitle: 'このサービス、使ってみたいですか？',
  finalSub: 'ほしい物や運べる日程を教えてください。どこから始めるかの参考にします。',
  footer1: 'TripCarryはまだサービス開始前です。開始に向けて関心をお聞きしています。',
  footer2: 'ブランド名・店舗名は説明のためのもので、TripCarryは各ブランドと提携していません。免税範囲は目安です。',
  terms: '利用規約（英語）',
  rules: '購入前の確認（英語）',
  help: 'ヘルプ（英語）',
  privacy: 'プライバシー（英語）',
  calc: '免税範囲の計算（英語）',
  preview: 'プレビュー（サンプル・韓国語）',
  badges: { store: '店舗限定', park: 'パーク限定', season: '季節限定', lottery: '店頭くじ' },
  modal: {
    title: '事前登録',
    sub: 'ルートごとに順番に開始します。事前登録で初回の手数料が無料になります。',
    email: 'メールアドレス',
    role: '私は…',
    roles: { buyer: '受け取りたい', traveler: '運べます', both: '両方' },
    route: 'どちら方向ですか？',
    routes: { 'JP-KR': '東京 → ソウル', 'KR-JP': 'ソウル → 東京', other: 'ほかの都市' },
    from: '購入する国',
    to: '受け取る国',
    item: 'ほしい物',
    itemPh: '例：オリーブヤング限定コスメ、K-POPアルバム特典',
    pay: '1件あたり払える謝礼（USD）',
    payPh: '例：15',
    supplyHead: '運び手の方に少しだけ質問です',
    kind: 'どれに当てはまりますか？',
    kinds: { resident: '現地在住', student: '留学生', business: '出張が多い', traveler: '旅行' },
    trips: '1年に何回往復しますか？',
    tripsOpts: { '1-2': '1〜2回', '3-5': '3〜5回', '6-11': '6〜11回', '12+': '12回以上' },
    kg: '荷物の空きはふだんどのくらい？',
    kgOpts: { '1': '1kg以下', '1-3': '1〜3kg', '3-5': '3〜5kg', '5+': '5kg以上' },
    minPay: '1件あたり最低いくらなら引き受けますか？（USD）',
    minPayPh: '例：20',
    optional: '任意',
    submit: '事前登録する',
    sending: '登録中…',
    consent: 'サービス開始のお知らせのみお送りします。いつでも配信停止できます。',
    doneTitle: '登録しました！',
    doneSub: 'ルートが開いたらメールでお知らせします。初回の手数料は無料です。',
    share: '韓国に住んでいる友だちがいたら、このページをシェアしてください。',
    close: '閉じる',
    pick: '選択',
    errorGeneric: '問題が発生しました。もう一度お試しください。',
    errorEmail: 'メールアドレスを確認してください。',
    errorBusy: '試行回数が多すぎます。1分ほどしてからもう一度お試しください。',
  },
};

export const DICT: Record<Lang, Dict> = { ko, en, ja };
export type { Dict };

/** 사전 등록 폼의 "다른 도시"에서 고르는 나라 (ISO 코드). 이름은 브라우저 Intl.DisplayNames로 표시한다. */
export const WAITLIST_COUNTRIES = [
  'US', 'KR', 'JP', 'CN', 'TW', 'HK', 'VN', 'TH', 'PH', 'ID', 'SG', 'MY', 'IN',
  'GB', 'FR', 'DE', 'IT', 'ES', 'NL', 'CA', 'MX', 'BR', 'AR', 'AU', 'NZ', 'AE', 'SA', 'QA', 'KW',
];

export function countryName(code: string, lang: Lang) {
  if (!code) return '';
  if (code === 'OTHER') return { ko: '기타', en: 'Other', ja: 'その他' }[lang];
  try {
    return new Intl.DisplayNames([lang], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}
