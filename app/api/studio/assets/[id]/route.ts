import { NextResponse, type NextRequest } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { readAsset } from '@/lib/assets';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const a = await readAsset((await params).id);
  if (!a) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return new NextResponse(new Uint8Array(a.buf), {
    headers: { 'content-type': a.type, 'cache-control': 'private, max-age=31536000, immutable', 'x-content-type-options': 'nosniff' },
  });
}
