import { NextResponse, type NextRequest } from 'next/server';
import { clean, clientIp, rateLimited } from '@/lib/data';
import { mutate, newId } from '@/lib/hub/store';

export async function POST(req: NextRequest) {
  if (rateLimited('apply:' + clientIp(req.headers), 5)) return NextResponse.json({ error: 'Too many attempts. Please try again in a minute.' }, { status: 429 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'Something was wrong with that request.' }, { status: 400 });
  // 봇만 채우는 숨은 칸
  if (clean(body.website)) return NextResponse.json({ ok: true });
  const name = clean(body.name, 80);
  const email = clean(body.email, 120).toLowerCase();
  if (!name) return NextResponse.json({ error: 'Please add your name.' }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Please check your email address.' }, { status: 400 });
  await mutate((hub) => {
    hub.leads.unshift({ id: newId(), at: new Date().toISOString(), name, email, handle: clean(body.handle, 80), message: typeof body.message === 'string' ? body.message.trim().slice(0, 2000) : '' });
  });
  return NextResponse.json({ ok: true });
}
