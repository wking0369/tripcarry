import { NextResponse, type NextRequest } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { saveVideo } from '@/lib/hub/media';

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 });
  if (!req.body) return NextResponse.json({ error: '파일이 없어요.' }, { status: 400 });
  try {
    return NextResponse.json(await saveVideo(req.body));
  } catch (e) {
    const code = e instanceof Error ? e.message : '';
    if (code === 'too_large') return NextResponse.json({ error: '영상은 500MB까지 올릴 수 있어요.' }, { status: 413 });
    if (code === 'bad_type') return NextResponse.json({ error: 'MP4나 MOV 영상만 올릴 수 있어요.' }, { status: 415 });
    console.error('video upload failed', e);
    return NextResponse.json({ error: '영상을 저장하지 못했어요.' }, { status: 500 });
  }
}
