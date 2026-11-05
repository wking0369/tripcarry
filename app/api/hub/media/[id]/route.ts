import type { NextRequest } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { mediaStat, mediaStream } from '@/lib/hub/media';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return new Response('로그인이 필요해요.', { status: 401 });
  const { id } = await params;
  const file = await mediaStat(id);
  if (!file) return new Response('없는 파일이에요.', { status: 404 });
  const headers: Record<string, string> = { 'content-type': 'video/mp4', 'accept-ranges': 'bytes', 'cache-control': 'private, max-age=3600' };
  const name = req.nextUrl.searchParams.get('download');
  if (name) headers['content-disposition'] = `attachment; filename*=UTF-8''${encodeURIComponent(name.replace(/[/\\"]/g, '_'))}.mp4`;

  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get('range') ?? '');
  if (range && (range[1] || range[2])) {
    const start = range[1] ? Number(range[1]) : Math.max(0, file.size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), file.size - 1) : file.size - 1;
    if (start > end || start >= file.size) return new Response(null, { status: 416, headers: { 'content-range': `bytes */${file.size}` } });
    return new Response(mediaStream(file.path, start, end), { status: 206, headers: { ...headers, 'content-range': `bytes ${start}-${end}/${file.size}`, 'content-length': String(end - start + 1) } });
  }
  return new Response(mediaStream(file.path, 0, file.size - 1), { headers: { ...headers, 'content-length': String(file.size) } });
}
