import { NextResponse, type NextRequest } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { assetDataUrl, readRefs } from '@/lib/assets';
import { clientIp, rateLimited } from '@/lib/data';
import { ASSET_ID, GOALS, type CaptionGoal } from '@/lib/studio';
import { AiSetupError, generatePost } from '@/lib/studio-ai';

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (rateLimited('ai:' + clientIp(req.headers), 20)) return NextResponse.json({ error: '잠시 후 다시 시도해 주세요.' }, { status: 429 });
  const b = await req.json().catch(() => null);
  const idea = typeof b?.idea === 'string' ? b.idea.trim().slice(0, 1000) : '';
  if (!idea) return NextResponse.json({ error: '아이디어를 적어 주세요.' }, { status: 400 });

  const photoIds: string[] = Array.isArray(b?.photoIds) ? b.photoIds.filter((x: unknown) => typeof x === 'string' && ASSET_ID.test(x)).slice(0, 5) : [];
  const refIds: string[] = Array.isArray(b?.refIds) ? b.refIds.filter((x: unknown) => typeof x === 'string').slice(0, 5) : [];
  const urls = await Promise.all(photoIds.map(assetDataUrl));
  const found = photoIds.map((id, i) => ({ id, url: urls[i] })).filter((p): p is { id: string; url: string } => Boolean(p.url));
  const refs = (await readRefs()).filter((r) => refIds.includes(r.id));

  try {
    const out = await generatePost({
      idea,
      lang: b?.lang === 'en' ? 'en' : 'ko',
      format: b?.format === 'story' ? 'story' : 'feed',
      goal: (GOALS.some((g) => g.id === b?.goal) ? b.goal : 'buyer') as CaptionGoal,
      slideCount: Math.min(8, Math.max(1, Number(b?.slideCount) || 4)),
      refs,
      photos: found.map((p) => p.url),
      photoIds: found.map((p) => p.id),
    });
    return NextResponse.json(out);
  } catch (e) {
    const msg = e instanceof AiSetupError ? e.message : `AI가 만들지 못했어요: ${e instanceof Error ? e.message : '알 수 없는 오류'}`;
    return NextResponse.json({ error: msg }, { status: e instanceof AiSetupError ? 400 : 502 });
  }
}
