import Link from 'next/link';
import { deletePost, updateMetrics } from '../../actions';
import { BREAKOUT_MULTIPLE, latest, measured, median, views } from '@/lib/hub/analytics';
import { pickCreator, readHub } from '@/lib/hub/store';
import { KIND_LABEL, todayKST } from '@/lib/hub/types';
import ActionForm from '../ActionForm';
import { currentCreatorId } from '@/lib/hub/current';

export const metadata = { title: '보관함' };

export default async function Archive({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month } = await searchParams;
  const hub = await readHub();
  const creator = pickCreator(hub, await currentCreatorId());
  if (!creator) return null;
  const all = hub.posts.filter((p) => p.creatorId === creator.id);
  const months = [...new Set([todayKST().slice(0, 7), ...all.map((p) => p.date.slice(0, 7))])].sort().reverse();
  const cur = month && months.includes(month) ? month : months[0];
  const list = all.filter((p) => p.date.startsWith(cur)).sort((a, b) => views(b) - views(a) || (a.date < b.date ? 1 : -1));
  const base = median(measured(all).map(views));
  return (
    <>
      <header className="page-head">
        <div>
          <h1>보관함</h1>
          <p>달별로 모아 조회수 순서로 보여 줘요. {cur}에 {list.length}개가 있어요.</p>
        </div>
        <Link className="btn" href="/studio/data">게시물 추가</Link>
      </header>
      <div className="seg seg-wrap" role="group" aria-label="달">
        {months.map((m) => <Link key={m} href={`/studio/archive?month=${m}`} aria-current={m === cur ? 'true' : undefined}>{m}</Link>)}
      </div>
      {list.length ? (
        <div className="archive">
          {list.map((p) => {
            const m = latest(p);
            const mult = m && base ? m.views / base : 0;
            return (
              <details key={p.id} className="row">
                <summary>
                  <span className="cell-title">{p.title}<small>{p.date}, {KIND_LABEL[p.kind]}{p.topic ? `, ${p.topic}` : ''}{p.trial ? ', 트라이얼 변형본' : ''}</small></span>
                  <span className="row-num">{m ? m.views.toLocaleString('ko-KR') : '수치 없음'}</span>
                  <span className="row-tag">{m ? (mult >= BREAKOUT_MULTIPLE ? <b className="hot">{mult.toFixed(1)}배</b> : `${mult.toFixed(1)}배`) : ''}</span>
                </summary>
                <div className="row-body">
                  {p.hook && <p><b>첫 문장</b> {p.hook}</p>}
                  {p.style && <p><b>스타일</b> {p.style}</p>}
                  <ActionForm action={updateMetrics} className="form form-grid">
                    <input type="hidden" name="id" value={p.id} />
                    <label>조회수<input name="views" defaultValue={m?.views} inputMode="numeric" required /></label>
                    <label>도달<input name="reach" defaultValue={m?.reach} inputMode="numeric" /></label>
                    <label>좋아요<input name="likes" defaultValue={m?.likes} inputMode="numeric" /></label>
                    <label>댓글<input name="comments" defaultValue={m?.comments} inputMode="numeric" /></label>
                    <label>저장<input name="saves" defaultValue={m?.saves} inputMode="numeric" /></label>
                    <label>공유<input name="shares" defaultValue={m?.shares} inputMode="numeric" /></label>
                    <label>팔로우<input name="follows" defaultValue={m?.follows} inputMode="numeric" /></label>
                    <label>평균 시청(초)<input name="avg_watch_sec" defaultValue={m?.avgWatchSec} inputMode="decimal" /></label>
                    <div className="span4 row-actions"><button className="btn" type="submit">수치 저장</button></div>
                  </ActionForm>
                  <div className="row-actions">
                    {p.kind === 'reel' && !p.trial && <Link className="btn btn-small" href={`/studio/trial?month=${p.date.slice(0, 7)}`}>트라이얼 후보 보기</Link>}
                    <form action={async () => { 'use server'; await deletePost(p.id); }}><button className="link-btn danger" type="submit">게시물 삭제</button></form>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      ) : <div className="empty"><p>{cur}에 보관한 게시물이 없어요.</p></div>}
    </>
  );
}
