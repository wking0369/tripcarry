import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// 결과 화면(/admin) 로그인. ADMIN_PASSWORD 하나로만 보호한다.
export const ADMIN_COOKIE = 'tc_admin';

export const adminConfigured = () => Boolean(process.env.ADMIN_PASSWORD);

function token() {
  return createHmac('sha256', process.env.ADMIN_PASSWORD || '').update('tripcarry-admin-v1').digest('hex');
}

export function checkPassword(input: string) {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(pw);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const sessionToken = token;

/**
 * 같은 사이트 안의 경로로 보내는 303 응답.
 * Railway 같은 프록시 뒤에서는 req.url이 내부 주소(localhost)라서 절대 주소를 만들면 안 된다.
 */
export function redirectTo(path: string) {
  return new NextResponse(null, { status: 303, headers: { location: path } });
}

export async function isAdmin() {
  if (!adminConfigured()) return false;
  const v = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!v) return false;
  const a = Buffer.from(v);
  const b = Buffer.from(token());
  return a.length === b.length && timingSafeEqual(a, b);
}
