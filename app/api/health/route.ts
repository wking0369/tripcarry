import { NextResponse } from 'next/server';
import { DEPLOY_VERSION, storage } from '@/lib/data';

export const dynamic = 'force-dynamic';

// 배포가 반영됐는지, 저장 공간이 연결됐는지 확인용 (비밀 정보는 넣지 않는다)
export function GET() {
  return NextResponse.json({ ok: true, version: DEPLOY_VERSION, storage: storage.persistent ? 'persistent' : 'temporary' });
}
