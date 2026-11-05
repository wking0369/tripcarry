import { redirect } from 'next/navigation';
import { adminConfigured, isAdmin } from '@/lib/admin';

export const metadata = { title: '크리에이터 허브 로그인', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isAdmin()) redirect('/studio');
  const { error } = await searchParams;
  return (
    <main className="hub-login">
      {!adminConfigured() ? (
        <p>Railway 변수에 <code>ADMIN_PASSWORD</code>를 추가하면 쓸 수 있어요.</p>
      ) : (
        <form method="post" action="/api/admin/login">
          <h1>크리에이터 허브</h1>
          <input type="hidden" name="next" value="/studio" />
          <label>
            관리자 비밀번호
            <input name="password" type="password" required autoFocus />
          </label>
          {error === '1' && <p className="msg msg-error" role="alert">비밀번호가 맞지 않아요.</p>}
          {error === 'wait' && <p className="msg msg-error" role="alert">시도가 너무 많아요. 1분 뒤에 다시 해 주세요.</p>}
          <button className="btn btn-main" type="submit">들어가기</button>
        </form>
      )}
    </main>
  );
}
