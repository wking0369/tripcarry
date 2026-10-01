import { NextResponse, type NextRequest } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { addRef, assetDataUrl, readRefs, removeRef } from '@/lib/assets';
import { AiSetupError, analyzeRef } from '@/lib/studio-ai';
import { ASSET_ID } from '@/lib/studio';

const deny = () => NextResponse.json({ error: 'unauthorized' }, { status: 401 });

export async function GET() {
  if (!(await isAdmin())) return deny();
  return NextResponse.json({ refs: await readRefs() });
}

/** 참고 게시물 추가: 올린 캡처를 AI가 읽어 스타일을 저장한다. AI가 안 되면 캡처만 저장. */
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return deny();
  const body = await req.json().catch(() => null);
  const assetId = String(body?.assetId ?? '');
  const note = typeof body?.note === 'string' ? body.note.slice(0, 300) : '';
  if (!ASSET_ID.test(assetId)) return NextResponse.json({ error: 'bad request' }, { status: 400 });
  const url = await assetDataUrl(assetId);
  if (!url) return NextResponse.json({ error: '이미지를 찾지 못했어요.' }, { status: 404 });
  let warning = '';
  let style = null;
  try {
    style = await analyzeRef(url, note);
  } catch (e) {
    warning = e instanceof AiSetupError ? e.message : `스타일 분석에 실패했어요: ${e instanceof Error ? e.message : ''}`.trim();
  }
  return NextResponse.json({ ref: await addRef(assetId, note, style), warning });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) return deny();
  const id = req.nextUrl.searchParams.get('id') ?? '';
  return (await removeRef(id)) ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'not found' }, { status: 404 });
}
