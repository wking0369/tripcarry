import { NextResponse, type NextRequest } from 'next/server';
import { addEvent, addSignup, clean, clientIp, rateLimited } from '@/lib/data';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ROLES = ['buyer', 'traveler', 'both'] as const;

export async function POST(req: NextRequest) {
  if (rateLimited('w:' + clientIp(req.headers), 10)) {
    return NextResponse.json({ error: 'Too many requests. Please try again in a minute.' }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  // 봇이 채우는 숨은 칸. 값이 있으면 성공한 척만 한다.
  if (clean(body?.website)) return NextResponse.json({ ok: true });

  const email = clean(body?.email, 200).toLowerCase();
  if (!EMAIL.test(email)) return NextResponse.json({ error: 'Please enter a valid email.' }, { status: 400 });
  const role = ROLES.includes(body?.role) ? (body.role as (typeof ROLES)[number]) : 'buyer';
  const vid = clean(body?.vid, 40);
  const src = clean(body?.src, 60) || 'direct';
  const lang = clean(body?.lang, 5);
  const at = new Date().toISOString();

  await addSignup({
    at,
    email,
    role,
    from: clean(body?.from, 40),
    to: clean(body?.to, 40),
    item: clean(body?.item, 200),
    pay: clean(body?.pay, 20),
    src,
    vid,
    lang,
  });
  if (vid) await addEvent({ at, type: 'signup', vid, src, path: '/', lang });
  return NextResponse.json({ ok: true });
}
