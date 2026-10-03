import type { Lang } from './i18n';

// 도쿄 → 서울 한정품 예시. 품목 종류를 보여 주기 위한 것이라 가격은 넣지 않는다.
// 실제 매장 정가와 리셀 시세를 확인한 뒤에만 retail/resale(원)을 채운다. (확인한 날짜는 checked에)

export type DropBadge = 'store' | 'park' | 'season' | 'lottery';

export interface Drop {
  id: string;
  emoji: string;
  tone: string;
  badge: DropBadge;
  name: Record<Lang, string>;
  where: Record<Lang, string>;
  retail?: number;
  resale?: number;
  checked?: string;
}

export const DROPS: Drop[] = [
  {
    id: 'pokemon-center',
    emoji: '🧸',
    tone: '#fde9c8',
    badge: 'store',
    name: { ko: '포켓몬센터 한정 굿즈', en: 'Pokémon Center exclusives', ja: 'ポケモンセンター限定グッズ' },
    where: { ko: '포켓몬센터 메가 도쿄 (이케부쿠로)', en: 'Pokémon Center Mega Tokyo (Ikebukuro)', ja: 'ポケモンセンターメガトウキョー（池袋）' },
  },
  {
    id: 'disney-resort',
    emoji: '🏰',
    tone: '#e3e9f7',
    badge: 'park',
    name: { ko: '도쿄 디즈니리조트 파크 굿즈', en: 'Tokyo Disney Resort park goods', ja: '東京ディズニーリゾートのパークグッズ' },
    where: { ko: '도쿄 디즈니랜드·디즈니씨', en: 'Tokyo Disneyland / DisneySea', ja: '東京ディズニーランド・シー' },
  },
  {
    id: 'ichiban-kuji',
    emoji: '🎟️',
    tone: '#fbe1e1',
    badge: 'lottery',
    name: { ko: '이치방쿠지 경품', en: 'Ichiban Kuji prizes', ja: '一番くじの景品' },
    where: { ko: '편의점·애니메이트 등 판매처', en: 'Convenience stores, Animate and more', ja: 'コンビニ・アニメイトなど' },
  },
  {
    id: 'nintendo-tokyo',
    emoji: '🎮',
    tone: '#fde2dc',
    badge: 'store',
    name: { ko: '닌텐도 도쿄 매장 굿즈', en: 'Nintendo Tokyo store goods', ja: 'Nintendo TOKYOのグッズ' },
    where: { ko: '닌텐도 도쿄 (시부야 파르코)', en: 'Nintendo Tokyo (Shibuya Parco)', ja: 'Nintendo TOKYO（渋谷PARCO）' },
  },
  {
    id: 'gundam-base',
    emoji: '🤖',
    tone: '#e6f0ec',
    badge: 'store',
    name: { ko: '건담베이스 한정 건프라', en: 'Gundam Base exclusive Gunpla', ja: 'ガンダムベース限定ガンプラ' },
    where: { ko: '건담베이스 도쿄 (오다이바)', en: 'The Gundam Base Tokyo (Odaiba)', ja: 'THE GUNDAM BASE（お台場）' },
  },
  {
    id: 'chrome-hearts',
    emoji: '💍',
    tone: '#eeeae0',
    badge: 'store',
    name: { ko: '크롬하츠 매장 상품', en: 'Chrome Hearts in-store items', ja: 'クロムハーツの店頭商品' },
    where: { ko: '크롬하츠 도쿄 매장', en: 'Chrome Hearts Tokyo stores', ja: 'クロムハーツ東京の店舗' },
  },
  {
    id: 'starbucks-jp',
    emoji: '🌸',
    tone: '#fce4ef',
    badge: 'season',
    name: { ko: '스타벅스 재팬 시즌 MD', en: 'Starbucks Japan seasonal merch', ja: 'スターバックス日本の季節限定グッズ' },
    where: { ko: '일본 스타벅스 매장', en: 'Starbucks stores in Japan', ja: '国内のスターバックス店舗' },
  },
  {
    id: 'jump-shop',
    emoji: '📚',
    tone: '#fff3c4',
    badge: 'store',
    name: { ko: '점프샵·애니 매장 한정 굿즈', en: 'Jump Shop & anime store exclusives', ja: 'ジャンプショップ・アニメ店舗限定グッズ' },
    where: { ko: '점프샵 시부야 등', en: 'Jump Shop Shibuya and others', ja: 'ジャンプショップ渋谷など' },
  },
];

export const DROP_IDS = new Set(DROPS.map((d) => d.id));
export const dropName = (id: string, lang: Lang) => DROPS.find((d) => d.id === id)?.name[lang] ?? id;
