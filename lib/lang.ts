import 'server-only';
import { cookies, headers } from 'next/headers';
import { LANG_COOKIE, docLang, pickLang } from './i18n';

/** 서버 화면에서 쓰는 현재 언어: 쿠키 → 브라우저 언어 → 한국어 */
export async function currentLang() {
  const [c, h] = await Promise.all([cookies(), headers()]);
  return pickLang(c.get(LANG_COOKIE)?.value, h.get('accept-language'));
}

/** 약관·규칙처럼 한국어/영어만 있는 문서용 */
export async function currentDocLang() {
  return docLang(await currentLang());
}
