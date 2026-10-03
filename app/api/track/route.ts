import { NextResponse, type NextRequest } from 'next/server';
import { addEvent, clean, clientIp, isBot, rateLimited, type EventType } from '@/lib/data';
import { DROP_IDS } from '@/lib/drops';

const TYPES: EventType[] = ['visit', 'cta', 'modal_open', 'want'];

// 방문·버튼 클릭 기록. 개인정보는 받지 않고, 브라우저마다 만든 임의 ID(vid)만 쓴다.
export async function POST(req: NextRequest) {
  if (isBot(req.headers.get('user-agent')) || rateLimited(clientIp(req.headers))) {
    return new NextResponse(null, { status: 204 });
  }
  const body = await req.json().catch(() => null);
  const type = body?.type as EventType;
  const vid = clean(body?.vid, 40);
  if (!TYPES.includes(type) || !vid) return NextResponse.json({ error: 'bad request' }, { status: 400 });
  // "이거 원해요"는 정해 둔 품목 ID만 받는다
  if (type === 'want' && !DROP_IDS.has(clean(body?.cta, 40))) return NextResponse.json({ error: 'bad request' }, { status: 400 });
  await addEvent({
    at: new Date().toISOString(),
    type,
    vid,
    src: clean(body?.src, 60) || 'direct',
    path: clean(body?.path, 100),
    lang: clean(body?.lang, 5),
    cta: clean(body?.cta, 40) || undefined,
    ref: clean(body?.ref, 100) || undefined,
  });
  return new NextResponse(null, { status: 204 });
}
