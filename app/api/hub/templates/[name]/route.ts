import type { NextRequest } from 'next/server';
import { FOLLOWER_TEMPLATE, POST_TEMPLATE } from '@/lib/hub/csv';

export async function GET(_: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const body = name === 'posts.csv' ? POST_TEMPLATE : name === 'followers.csv' ? FOLLOWER_TEMPLATE : null;
  if (!body) return new Response('없는 파일이에요.', { status: 404 });
  return new Response(`﻿${body}`, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="${name}"` } });
}
