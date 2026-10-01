import type { NextRequest } from 'next/server';
import { ADMIN_COOKIE, checkPassword, redirectTo, sessionToken } from '@/lib/admin';
import { clientIp, rateLimited } from '@/lib/data';

export async function POST(req: NextRequest) {
  if (rateLimited('a:' + clientIp(req.headers), 10)) {
    return redirectTo('/admin?error=wait');
  }
  const form = await req.formData();
  // 로그인 후 돌아갈 곳: 사이트 안 경로만 허용
  const nextRaw = String(form.get('next') ?? '/admin');
  const next = /^\/(admin|studio)(\/|$|\?)/.test(nextRaw) ? nextRaw : '/admin';
  if (!checkPassword(String(form.get('password') ?? ''))) {
    return redirectTo(`${next.split('?')[0]}?error=1`);
  }
  const res = redirectTo(next);
  res.cookies.set(ADMIN_COOKIE, sessionToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
