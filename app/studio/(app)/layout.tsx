import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/admin';
import { removeSample } from '../actions';
import { pickCreator, readHub } from '@/lib/hub/store';
import { storage } from '@/lib/data';
import { currentCreatorId } from '@/lib/hub/current';
import CreatorSwitch from './CreatorSwitch';
import Nav from './Nav';

export const metadata = { title: '크리에이터 허브', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function HubLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect('/studio/login');
  const hub = await readHub();
  const creator = pickCreator(hub, await currentCreatorId());
  const pending = hub.queue.filter((q) => q.creatorId === creator?.id && q.status === 'draft').length;

  return (
    <div className="hub">
      <aside className="hub-side">
        <p className="hub-name">크리에이터 허브</p>
        <CreatorSwitch current={creator?.id} creators={hub.creators.map((c) => ({ id: c.id, name: c.name }))} />
        <Nav pending={pending} leads={hub.leads.length} />
        <form method="post" action="/api/admin/logout" className="hub-out"><button className="link-btn" type="submit">로그아웃</button></form>
      </aside>
      <div className="hub-main">
        {!storage.persistent && <p className="msg msg-warn">{storage.message}</p>}
        {creator?.sample && (
          <div className="hub-sample">
            <p>지금 보는 건 <b>가상의 샘플 데이터</b>예요. 실제 계정을 추가하고 나면 지워 주세요.</p>
            <form action={removeSample}><button className="btn btn-small" type="submit">샘플 지우기</button></form>
          </div>
        )}
        {creator ? children : (
          <div className="empty">
            <h1>첫 계정을 추가해 주세요</h1>
            <p>인물·카드뉴스 메뉴에서 계정을 만들면 분석과 보관함을 쓸 수 있어요.</p>
            <a className="btn btn-main" href="/studio/people">계정 추가하기</a>
          </div>
        )}
      </div>
    </div>
  );
}
