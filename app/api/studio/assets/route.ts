import { NextResponse, type NextRequest } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { MAX_ASSET_BYTES, saveAsset } from '@/lib/assets';

// 이미지 업로드: 본문이 그대로 이미지 바이트 (브라우저에서 JPEG로 줄여서 보냄)
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const len = Number(req.headers.get('content-length') || 0);
  if (len > MAX_ASSET_BYTES) return NextResponse.json({ error: '이미지가 너무 커요 (4MB 이하).' }, { status: 413 });
  try {
    const id = await saveAsset(Buffer.from(await req.arrayBuffer()));
    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '올리지 못했어요.' }, { status: 400 });
  }
}
