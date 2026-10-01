import { NextResponse, type NextRequest } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { createPost, postStats, readPosts } from '@/lib/posts';

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const posts = await readPosts();
  return NextResponse.json({ posts, stats: await postStats(posts) });
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'bad request' }, { status: 400 });
  return NextResponse.json({ post: await createPost(body) });
}
