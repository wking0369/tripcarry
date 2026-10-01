import { adminConfigured, isAdmin } from '@/lib/admin';
import StudioClient from './StudioClient';

export const metadata = { title: '마케팅 스튜디오', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function StudioPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (!adminConfigured()) {
    return (
      <main className="page" style={{ maxWidth: 560 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>마케팅 스튜디오</h1>
        <div className="notice notice-warn">Railway 변수에 <code>ADMIN_PASSWORD</code>를 추가하면 쓸 수 있어요.</div>
      </main>
    );
  }
  if (!(await isAdmin())) {
    return (
      <main className="login-wrap">
        <form className="card login-card" method="post" action="/api/admin/login">
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>마케팅 스튜디오</h1>
          <input type="hidden" name="next" value="/studio" />
          <div className="field">
            <label htmlFor="pw">관리자 비밀번호</label>
            <input id="pw" name="password" type="password" className="input" required autoFocus />
          </div>
          {error && <div className="notice notice-warn">비밀번호가 맞지 않아요.</div>}
          <button className="btn btn-primary" type="submit">들어가기</button>
        </form>
      </main>
    );
  }
  return <StudioClient />;
}
