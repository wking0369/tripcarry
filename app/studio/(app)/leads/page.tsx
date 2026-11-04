import { deleteLead } from '../../actions';
import { readHub } from '@/lib/hub/store';
import { fmtDateTimeKST } from '@/lib/hub/types';

export const metadata = { title: '파일럿 신청' };

export default async function Leads() {
  const { leads } = await readHub();
  return (
    <>
      <header className="page-head">
        <div>
          <h1>파일럿 신청</h1>
          <p>공개 페이지의 신청 폼으로 들어온 내용이에요.</p>
        </div>
        <a className="btn" href="/" target="_blank" rel="noreferrer">공개 페이지 보기</a>
      </header>
      {leads.length ? (
        <ul className="list">
          {leads.map((l) => (
            <li key={l.id}>
              <span className="when">{fmtDateTimeKST(l.at)}</span>
              <span className="cell-title">{l.name} {l.handle && `(${l.handle})`}<small><a href={`mailto:${l.email}`}>{l.email}</a>{l.message ? `, ${l.message}` : ''}</small></span>
              <form action={async () => { 'use server'; await deleteLead(l.id); }}><button className="link-btn danger" type="submit">삭제</button></form>
            </li>
          ))}
        </ul>
      ) : <div className="empty"><p>아직 들어온 신청이 없어요.</p></div>}
      <p className="hint">트립캐리 사전등록 명단은 <a href="/api/admin/export">CSV로 계속 받을 수 있어요</a>.</p>
    </>
  );
}
