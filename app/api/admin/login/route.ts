import type { NextRequest } from 'next/server';
import { ADMIN_COOKIE, checkPassword, redirectTo, sessionToken } from '@/lib/admin';
import { clientIp, rateLimited } from '@/lib/data';

export async function POST(req: NextRequest) {
  if (rateLimited('a:' + clientIp(req.headers), 10)) {
    return redirectTo('/admin?error=wait');
  }
  const form = await req.formData();
  if (!checkPassword(String(form.get('password') ?? ''))) {
    return redirectTo('/admin?error=1');
  }
  const res = redirectTo('/admin');
  res.cookies.set(ADMIN_COOKIE, sessionToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
