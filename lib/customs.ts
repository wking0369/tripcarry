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
  supplement: { label: '건강기능식품·의약품', status: 'limit', note: '자가 사용 소량만 허용돼요(한국 6병, 일본 2개월분 등). 처방약·특정 성분은 금지될 수 있어요.' },
  alcohol: { label: '주류', status: 'limit', note: '나라별 면세 병 수 안에서만 별도 면세예요. 넘으면 과세돼요.' },
  tobacco: { label: '담배', status: 'limit', note: '1보루(200개비) 안에서만 면세예요. 대리 운반은 권장하지 않아요.' },
  battery: { label: '보조배터리·리튬 제품', status: 'limit', note: '기내 휴대만 가능하고 160Wh 이하만 돼요(100Wh 초과는 항공사 승인 필요).' },
  meat: { label: '육류·육가공품', status: 'block', note: '육포·소시지·햄·만두 등 육가공품은 대부분 나라에서 반입 금지예요.' },
  fresh: { label: '생과일·채소·씨앗', status: 'block', note: '검역 대상이라 대부분 나라에서 반입 금지예요.' },
};

export const CATEGORY_LIST = Object.entries(CATEGORIES).map(([key, v]) => ({ key: key as Category, ...v }));

// 물품 이름에 들어 있으면 자동으로 막는 단어들. 카테고리를 잘못 골라도 걸러진다.
const BLOCK_WORDS: { words: string[]; reason: string }[] = [
  { words: ['육포', '소시지', '하몽', '살라미', '햄', '만두', '베이컨', 'jerky', 'sausage', 'jamon', 'salami'], reason: '육가공품으로 보여요' },
  { words: ['생과일', '씨앗', '묘목', '망고스틴', '두리안'], reason: '검역 대상(생과일·씨앗)으로 보여요' },
  { words: ['짝퉁', '레플리카', '이미테이션', 'replica', '가품', '미러급'], reason: '모조품은 모든 나라에서 반입 금지예요' },
  { words: ['총', '도검', '칼날', '가스총', '전기충격기', '마약', '대마', 'cbd'], reason: '무기·마약류는 반입 금지예요' },
];

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

export function detectBlockWord(name: string): string | null {
  const lower = name.toLowerCase();
  for (const b of BLOCK_WORDS) {
    if (b.words.some((w) => lower.includes(w.toLowerCase()))) return b.reason;
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
}): GuardResult {
  const { to, resident = true, items, existingUSD = 0 } = opts;
  const country = COUNTRIES[to];
  const allowance = allowanceUSD(to, resident);
  const messages: GuardResult['messages'] = [];
  let blocked = false;
  let counted = 0;

  for (const it of items) {
    const rule = CATEGORIES[it.category];
    const word = it.name ? detectBlockWord(it.name) : null;
    const value = Math.max(0, it.unitUSD) * Math.max(1, it.qty);
    if (rule.status === 'block') {
      blocked = true;
      messages.push({ level: 'block', text: `${rule.label}: ${rule.note}` });
      continue;
    }
    if (word) {
      blocked = true;
      messages.push({ level: 'block', text: `“${it.name}” — ${word}` });
      continue;
    }
    if (it.category === 'alcohol') {
      if (it.qty <= country.alcoholBottles) {
        messages.push({ level: 'info', text: `주류 ${it.qty}병은 ${country.name} 별도 면세 범위(${country.alcoholBottles}병) 안이에요.` });
        continue;
      }
      messages.push({ level: 'warn', text: `주류는 ${country.name}에서 ${country.alcoholBottles}병까지만 별도 면세예요. 초과분은 과세돼요.` });
    } else if (it.category === 'supplement' && it.qty > 6) {
      messages.push({ level: 'warn', text: '건강기능식품은 보통 6병(자가 사용량)까지만 허용돼요. 수량을 줄여 주세요.' });
    } else if (rule.status === 'limit' || rule.note) {
      messages.push({ level: rule.status === 'limit' ? 'warn' : 'info', text: `${rule.label}: ${rule.note}` });
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
        text: `${country.name} 면세 한도(${country.allowanceNote})를 $${fmt(excess)} 넘어요. 예상 세금 약 $${fmt(estDuty)}를 미리 결제하고, 여행자가 입국 때 자진 신고해야 해요.`,
      });
    } else {
      messages.unshift({ level: 'ok', text: `${country.name} 면세 한도 안이에요. 남은 한도 $${fmt(allowance - total)}.` });
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
