import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE, checkPassword, sessionToken } from '@/lib/admin';
import { clientIp, rateLimited } from '@/lib/data';

export async function POST(req: NextRequest) {
  if (rateLimited('a:' + clientIp(req.headers), 10)) {
    return NextResponse.redirect(new URL('/admin?error=wait', req.url), 303);
  }
  const form = await req.formData();
  if (!checkPassword(String(form.get('password') ?? ''))) {
    return NextResponse.redirect(new URL('/admin?error=1', req.url), 303);
  }
  const res = NextResponse.redirect(new URL('/admin', req.url), 303);
  res.cookies.set(ADMIN_COOKIE, sessionToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
