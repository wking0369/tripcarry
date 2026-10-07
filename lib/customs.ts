// 국가별 면세 규정 자동화(Customs Guard) — 데모용 규정표와 판정 로직.
// 실제 서비스에서는 관세청 공지나 Zonos 같은 관세 API로 주기적으로 갱신해야 한다.
// 금액은 모두 USD 기준으로 계산하고, 환율은 데모용 고정값을 쓴다.

export type CountryCode = 'KR' | 'US' | 'JP' | 'FR' | 'DE' | 'CN' | 'VN';

export type Category =
  | 'general'
  | 'electronics'
  | 'cosmetics'
  | 'luxury'
  | 'food'
  | 'supplement'
  | 'alcohol'
  | 'tobacco'
  | 'battery'
  | 'meat'
  | 'fresh';

export interface Country {
  code: CountryCode;
  name: string;
  flag: string;
  currency: string;
  /** 1 USD 당 현지 통화 (데모용 고정 환율) */
  perUSD: number;
  /** 거주자 기준 면세 한도 (현지 통화) */
  allowance: number;
  /** 비거주자(방문객) 한도가 다르면 적어 둔다 */
  visitorAllowance?: number;
  allowanceNote: string;
  /** 한도 초과분에 붙는 세금 추정치 (관세+부가세 대략) */
  dutyRate: number;
  /** 술 면세 병 수 (이 안이면 일반 한도와 별도) */
  alcoholBottles: number;
  extras: string[];
}

export const COUNTRIES: Record<CountryCode, Country> = {
  KR: {
    code: 'KR', name: '한국', flag: '🇰🇷', currency: 'KRW', perUSD: 1380,
    allowance: 800 * 1380,
    allowanceNote: '여행자 휴대품 $800',
    dutyRate: 0.2, alcoholBottles: 2,
    extras: ['술 2병(합계 2L·$400 이하) 별도 면세', '담배 200개비 별도 면세', '향수 100ml 별도 면세', '자진 신고 시 세액 30% 감면(최대 20만 원)'],
  },
  US: {
    code: 'US', name: '미국', flag: '🇺🇸', currency: 'USD', perUSD: 1,
    allowance: 800, visitorAllowance: 100,
    allowanceNote: '거주자 $800 · 방문객 선물 $100',
    dutyRate: 0.03, alcoholBottles: 1,
    extras: ['술 1L 별도 면세(21세 이상)', '담배 200개비', '한도 초과 후 $1,000까지 3% 간이 세율'],
  },
  JP: {
    code: 'JP', name: '일본', flag: '🇯🇵', currency: 'JPY', perUSD: 148,
    allowance: 200000,
    allowanceNote: '해외 시가 합계 ¥200,000',
    dutyRate: 0.15, alcoholBottles: 3,
    extras: ['술 3병(760ml 기준) 별도 면세', '담배 200개비', '향수 2온스', '1품목 ¥10,000 이하 소액품은 합산 제외'],
  },
  FR: {
    code: 'FR', name: '프랑스(EU)', flag: '🇫🇷', currency: 'EUR', perUSD: 0.92,
    allowance: 430,
    allowanceNote: '항공·선박 €430 (육로 €300)',
    dutyRate: 0.22, alcoholBottles: 1,
    extras: ['증류주 1L 또는 와인 4L 별도 면세', '담배 200개비', '15세 미만은 €150'],
  },
  DE: {
    code: 'DE', name: '독일(EU)', flag: '🇩🇪', currency: 'EUR', perUSD: 0.92,
    allowance: 430,
    allowanceNote: '항공·선박 €430 (육로 €300)',
    dutyRate: 0.22, alcoholBottles: 1,
    extras: ['증류주 1L 또는 와인 4L 별도 면세', '담배 200개비', '15세 미만은 €175'],
  },
  CN: {
    code: 'CN', name: '중국', flag: '🇨🇳', currency: 'CNY', perUSD: 7.2,
    allowance: 5000, visitorAllowance: 2000,
    allowanceNote: '거주자 ¥5,000 · 비거주자 ¥2,000',
    dutyRate: 0.2, alcoholBottles: 2,
    extras: ['술 1.5L 별도 면세', '담배 400개비(거주자)', '세율 13%·20%·50% 품목별 차등'],
  },
  VN: {
    code: 'VN', name: '베트남', flag: '🇻🇳', currency: 'VND', perUSD: 25400,
    allowance: 10_000_000,
    allowanceNote: '₫10,000,000',
    dutyRate: 0.2, alcoholBottles: 1,
    extras: ['20도 이상 술 1.5L 별도 면세', '담배 200개비'],
  },
};

export const COUNTRY_LIST = Object.values(COUNTRIES);

type RuleStatus = 'ok' | 'limit' | 'block';

export const CATEGORIES: Record<Category, { label: string; status: RuleStatus; note: string }> = {
  general: { label: '의류·잡화·굿즈', status: 'ok', note: '' },
  electronics: { label: '전자기기', status: 'ok', note: '고가 전자기기는 세관에서 확인할 수 있어요. 영수증을 꼭 받아 두세요.' },
  cosmetics: { label: '화장품·향수', status: 'ok', note: '액체류 100ml 초과는 기내 반입이 안 돼요. 위탁 수하물로 부쳐야 해요.' },
  luxury: { label: '명품·고가품', status: 'ok', note: '고가품은 세관 신고 대상일 가능성이 높아요. 영수증과 사진을 반드시 남겨요.' },
  food: { label: '포장 가공식품', status: 'ok', note: '밀봉된 가공식품만 가능해요. 육류 성분이 들어가면 반입 금지예요.' },
  supplement: { label: '건강기능식품', status: 'limit', note: '자가 사용 소량만 허용돼요(한국 6병, 일본 2개월분 등). 의약품은 요청할 수 없어요.' },
  alcohol: { label: '주류', status: 'block', note: '주류는 다루지 않아요. 여행자 면세는 본인이 마실 술만 해당되고, 돈을 받고 술을 넘기면 면허가 필요한 주류 판매가 될 수 있어요.' },
  tobacco: { label: '담배', status: 'block', note: '담배는 다루지 않아요. 여행자 면세는 본인 사용분만 해당되고, 담배 판매는 허가가 필요해요.' },
  battery: { label: '보조배터리·리튬 제품', status: 'limit', note: '기내 휴대만 가능하고 160Wh 이하만 돼요(100Wh 초과는 항공사 승인 필요).' },
  meat: { label: '육류·육가공품', status: 'block', note: '육포·소시지·햄·만두 등 육가공품은 대부분 나라에서 반입 금지예요.' },
  fresh: { label: '생과일·채소·씨앗', status: 'block', note: '검역 대상이라 대부분 나라에서 반입 금지예요.' },
};

export const CATEGORY_LIST = Object.entries(CATEGORIES).map(([key, v]) => ({ key: key as Category, ...v }));

// 물품 이름에 들어 있으면 자동으로 막는 단어들. 카테고리를 잘못 골라도 걸러진다.
const BLOCK_WORDS: { words: string[]; reason: string; en: string }[] = [
  { words: ['육포', '소시지', '하몽', '살라미', '햄', '만두', '베이컨', 'jerky', 'sausage', 'jamon', 'jamón', 'salami', 'prosciutto', 'bacon', 'dumpling'], reason: '육가공품으로 보여요', en: 'looks like a meat product' },
  { words: ['생과일', '씨앗', '묘목', '망고스틴', '두리안'], reason: '검역 대상(생과일·씨앗)으로 보여요', en: 'looks like fresh produce or seeds (quarantine)' },
  { words: ['짝퉁', '레플리카', '이미테이션', 'replica', '가품', '미러급', 'counterfeit', 'fake ', 'knockoff', 'dupe bag'], reason: '모조품은 모든 나라에서 반입 금지예요', en: 'counterfeits are banned everywhere' },
  { words: ['처방', '전문의약품', '의약품', '항생제', '수면제', 'prescription', 'antibiotic', 'opioid'], reason: '의약품은 반입이 제한돼 요청할 수 없어요', en: 'medicines are restricted and can’t be requested' },
  { words: ['사케', '니혼슈', '일본주', '위스키', '와인', '맥주', '소주', '하이볼', '샴페인', '보드카', '양주', '매실주', 'whisky', 'whiskey', 'wine', 'beer', 'champagne', 'vodka', 'liquor', '酒', 'ワイン', 'ウイスキー'], reason: '주류는 다루지 않아요 (본인용 면세만 가능하고, 술을 넘기면 주류 판매가 될 수 있어요)', en: 'alcohol isn’t allowed (allowances are for your own use, and passing it on can count as selling alcohol)' },
  { words: ['담배', '전자담배', '궐련', '아이코스', '시가렛', 'cigarette', 'cigar', 'iqos', 'vape', 'tobacco'], reason: '담배는 다루지 않아요', en: 'tobacco isn’t allowed' },
  { words: ['총', '도검', '칼날', '가스총', '전기충격기', '마약', '대마', 'cbd', 'taser', 'pepper spray', 'cannabis', 'marijuana', 'gun '], reason: '무기·마약류는 반입 금지예요', en: 'weapons and drugs are banned' },
];

export type Lang = 'ko' | 'en';

// 랜딩 페이지(영어)용 문구. 한국어 원문은 위 표에 있다.
const COUNTRY_EN: Record<CountryCode, { name: string; allowanceNote: string; extras: string[] }> = {
  KR: { name: 'South Korea', allowanceNote: '$800 per traveler', extras: ['2 bottles of alcohol (2L total, ≤$400) exempt separately', '200 cigarettes exempt separately', '100ml perfume exempt separately', '30% duty reduction for voluntary declaration (up to ₩200,000)'] },
  US: { name: 'United States', allowanceNote: 'Residents $800 · Visitors $100 in gifts', extras: ['1L alcohol exempt (21+)', '200 cigarettes', 'Flat 3% on the next $1,000 over the limit'] },
  JP: { name: 'Japan', allowanceNote: '¥200,000 total overseas value', extras: ['3 bottles of alcohol (760ml) exempt separately', '200 cigarettes', '2 oz perfume', 'Items under ¥10,000 each are excluded from the total'] },
  FR: { name: 'France (EU)', allowanceNote: '€430 by air/sea (€300 by land)', extras: ['1L spirits or 4L wine exempt separately', '200 cigarettes', '€150 for under-15s'] },
  DE: { name: 'Germany (EU)', allowanceNote: '€430 by air/sea (€300 by land)', extras: ['1L spirits or 4L wine exempt separately', '200 cigarettes', '€175 for under-15s'] },
  CN: { name: 'China', allowanceNote: 'Residents ¥5,000 · Non-residents ¥2,000', extras: ['1.5L alcohol exempt', '400 cigarettes (residents)', 'Rates of 13% / 20% / 50% by item'] },
  VN: { name: 'Vietnam', allowanceNote: '₫10,000,000', extras: ['1.5L of 20%+ alcohol exempt', '200 cigarettes'] },
};

const CATEGORY_EN: Record<Category, { label: string; note: string }> = {
  general: { label: 'Clothing, goods & merch', note: '' },
  electronics: { label: 'Electronics', note: 'Customs may inspect pricey electronics. Keep the receipt.' },
  cosmetics: { label: 'Cosmetics & perfume', note: 'Liquids over 100ml must go in checked baggage.' },
  luxury: { label: 'Luxury goods', note: 'High-value items are likely to need declaring. Keep receipts and photos.' },
  food: { label: 'Packaged snacks & food', note: 'Sealed, processed food only. Anything with meat is banned.' },
  supplement: { label: 'Health supplements', note: 'Personal-use quantities only (e.g. 6 bottles in Korea). Medicines can’t be requested.' },
  alcohol: { label: 'Alcohol', note: 'We don’t handle alcohol. Traveler allowances cover only your own drinks, and handing over alcohol for money can count as selling alcohol, which needs a licence.' },
  tobacco: { label: 'Tobacco', note: 'We don’t handle tobacco. Allowances cover only your own use, and selling tobacco needs a licence.' },
  battery: { label: 'Power banks & lithium', note: 'Carry-on only, up to 160Wh (over 100Wh needs airline approval).' },
  meat: { label: 'Meat & meat products', note: 'Jerky, sausage, ham, dumplings etc. are banned in most countries.' },
  fresh: { label: 'Fresh fruit, veg & seeds', note: 'Quarantine items — banned in most countries.' },
};

export function countryText(code: CountryCode, lang: Lang) {
  const c = COUNTRIES[code];
  return lang === 'en' ? COUNTRY_EN[code] : { name: c.name, allowanceNote: c.allowanceNote, extras: c.extras };
}

export function categoryText(key: Category, lang: Lang) {
  return lang === 'en' ? CATEGORY_EN[key] : { label: CATEGORIES[key].label, note: CATEGORIES[key].note };
}

export function toUSD(amount: number, code: CountryCode) {
  return amount / COUNTRIES[code].perUSD;
}

export function allowanceUSD(code: CountryCode, resident: boolean) {
  const c = COUNTRIES[code];
  const local = !resident && c.visitorAllowance != null ? c.visitorAllowance : c.allowance;
  return toUSD(local, code);
}

export interface GuardItem {
  name: string;
  category: Category;
  unitUSD: number;
  qty: number;
}

export type Zone = 'safe' | 'warn' | 'block';

export interface GuardResult {
  zone: Zone;
  allowanceUSD: number;
  /** 이번 여행에 이미 실린 물품 금액 */
  existingUSD: number;
  /** 한도 계산에 들어가는 이번 물품 금액 */
  countedUSD: number;
  totalUSD: number;
  excessUSD: number;
  estDutyUSD: number;
  usedPct: number;
  messages: { level: 'ok' | 'warn' | 'block' | 'info'; text: string }[];
}

export function detectBlockWord(name: string, lang: Lang = 'ko'): string | null {
  const lower = name.toLowerCase() + ' ';
  for (const b of BLOCK_WORDS) {
    if (b.words.some((w) => lower.includes(w.toLowerCase()))) return lang === 'en' ? b.en : b.reason;
  }
  return null;
}

/**
 * 도착 국가 기준으로 물품이 면세 안전 구역인지, 초과(신고·관세 선결제)인지, 금지인지 판정한다.
 * existingUSD: 같은 여행자가 이번 여행에 이미 맡은 물품 합계 — 면세 한도는 여행자 한 명당이라 합산해야 한다.
 */
export function evaluate(opts: {
  to: CountryCode;
  resident?: boolean;
  items: GuardItem[];
  existingUSD?: number;
  lang?: Lang;
}): GuardResult {
  const { to, resident = true, items, existingUSD = 0, lang = 'ko' } = opts;
  const en = lang === 'en';
  const country = COUNTRIES[to];
  const ct = countryText(to, lang);
  const allowance = allowanceUSD(to, resident);
  const messages: GuardResult['messages'] = [];
  let blocked = false;
  let counted = 0;

  for (const it of items) {
    const rule = CATEGORIES[it.category];
    const rt = categoryText(it.category, lang);
    const word = it.name ? detectBlockWord(it.name, lang) : null;
    const value = Math.max(0, it.unitUSD) * Math.max(1, it.qty);
    if (rule.status === 'block') {
      blocked = true;
      messages.push({ level: 'block', text: `${rt.label}: ${rt.note}` });
      continue;
    }
    if (word) {
      blocked = true;
      messages.push({ level: 'block', text: `“${it.name}” — ${word}` });
      continue;
    }
    if (it.category === 'supplement' && it.qty > 6) {
      messages.push({
        level: 'warn',
        text: en ? 'Supplements are usually limited to about 6 bottles (personal use). Please reduce the quantity.' : '건강기능식품은 보통 6병(자가 사용량)까지만 허용돼요. 수량을 줄여 주세요.',
      });
    } else if (rule.status === 'limit' || rt.note) {
      messages.push({ level: rule.status === 'limit' ? 'warn' : 'info', text: `${rt.label}: ${rt.note}` });
    }
    counted += value;
  }

  const total = existingUSD + counted;
  const excess = Math.max(0, total - allowance);
  // 이미 실린 물품이 한도를 넘겼다면 그 초과분은 이전 요청 몫이라 이번 요청에는 새로 생긴 초과분만 매긴다.
  const newExcess = Math.max(0, excess - Math.max(0, existingUSD - allowance));
  const estDuty = newExcess * country.dutyRate;

  let zone: Zone = 'safe';
  if (blocked) zone = 'block';
  else if (excess > 0 || messages.some((m) => m.level === 'warn')) zone = 'warn';

  if (!blocked) {
    if (excess > 0) {
      messages.unshift({
        level: 'warn',
        text: en
          ? `$${fmt(excess)} over ${ct.name}’s duty-free limit (${ct.allowanceNote}). Estimated duty ~$${fmt(estDuty)} is prepaid and the traveler declares it on arrival.`
          : `${ct.name} 면세 한도(${ct.allowanceNote})를 $${fmt(excess)} 넘어요. 예상 세금 약 $${fmt(estDuty)}를 미리 결제하고, 여행자가 입국 때 자진 신고해야 해요.`,
      });
    } else {
      messages.unshift({
        level: 'ok',
        text: en
          ? `Within ${ct.name}’s duty-free limit. $${fmt(allowance - total)} left.`
          : `${ct.name} 면세 한도 안이에요. 남은 한도 $${fmt(allowance - total)}.`,
      });
    }
  }

  return {
    zone,
    allowanceUSD: allowance,
    existingUSD,
    countedUSD: counted,
    totalUSD: total,
    excessUSD: excess,
    estDutyUSD: estDuty,
    usedPct: allowance > 0 ? Math.min(100, (total / allowance) * 100) : 100,
    messages,
  };
}

export function fmt(n: number) {
  return n.toLocaleString('en-US', { maximumFractionDigits: n < 100 ? 2 : 0 });
}

export function fmtKRW(usd: number) {
  const won = Math.max(0, Math.round((usd * COUNTRIES.KR.perUSD) / 100) * 100);
  return `${won.toLocaleString('ko-KR')}원`;
}
