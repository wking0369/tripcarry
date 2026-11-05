import Link from 'next/link';
import { deleteVariant, runDueNow, saveVariant, unapproveVariant } from '../../actions';
import { trialCandidates, views } from '@/lib/hub/analytics';
import { MAX_PER_DAY } from '@/lib/hub/scheduler';
import { pickCreator, readHub } from '@/lib/hub/store';
import { fmtDateTimeKST, todayKST } from '@/lib/hub/types';
import ActionForm from '../ActionForm';
import { currentCreatorId } from '@/lib/hub/current';
import IntentButton from './IntentButton';
import VariantButton from './VariantButton';

export const metadata = { title: '트라이얼' };

export default async function Trial({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month } = await searchParams;
  const hub = await readHub();
  const creator = pickCreator(hub, await currentCreatorId());
  if (!creator) return null;
  const posts = hub.posts.filter((p) => p.creatorId === creator.id);
  const months = [...new Set([...posts.filter((p) => p.kind === 'reel').map((p) => p.date.slice(0, 7)), todayKST().slice(0, 7)])].sort().reverse();
  // 달을 고르지 않으면 후보가 충분한 가장 최근 달을 보여 준다 (월초에는 지난달)
  const cur = month && months.includes(month) ? month : months.find((m) => trialCandidates(posts, m).length >= 3) ?? months[0];
  const candidates = trialCandidates(posts, cur);
  const queue = hub.queue.filter((q) => q.creatorId === creator.id);
  const drafts = queue.filter((q) => q.status === 'draft');
  const scheduled = queue.filter((q) => q.status === 'scheduled').sort((a, b) => (a.scheduledAt! < b.scheduledAt! ? -1 : 1));
  const posted = queue.filter((q) => q.status === 'posted').sort((a, b) => (a.postedAt! < b.postedAt! ? 1 : -1));
  const renders = hub.projects.filter((p) => p.creatorId === creator.id).flatMap((p) => p.renders.map((r) => ({ id: r.id, label: `${p.title} (${r.label})` })));
  const postById = new Map(posts.map((p) => [p.id, p]));
  return (
    <>
      <header className="page-head">
        <div>
          <h1>트라이얼</h1>
          <p>잘 된 릴스를 바꿔서 팔로워가 아닌 사람들에게 다시 시험해요. 네가 승인한 것만 하루 최대 {MAX_PER_DAY}개씩 나가요.</p>
        </div>
      </header>
      <p className="msg msg-warn">지금은 <b>테스트 모드</b>예요. 인스타에 연결돼 있지 않아서 실제로 올라가지 않고, 게시 시간이 되면 기록만 남아요.</p>

      <section>
        <div className="sec-head"><h2>승인 대기 {drafts.length}개</h2></div>
        {drafts.length ? drafts.map((q) => {
          const src = postById.get(q.sourcePostId);
          return (
            <ActionForm key={q.id} action={saveVariant} className="variant">
              <input type="hidden" name="id" value={q.id} />
              <input type="hidden" name="intent" defaultValue="save" />
              <p className="variant-src">원본: {src?.hook || src?.title} <small>{src ? `조회수 ${views(src).toLocaleString('ko-KR')}회` : '삭제된 게시물'}</small></p>
              {q.hookOptions.length > 0 && (
                <p className="hint">AI 제안: {q.hookOptions.map((h, i) => <span key={i} className="chip">{h}</span>)}</p>
              )}
              <div className="form">
                <label>새 첫 문장<input name="hook" defaultValue={q.hook} /></label>
                <label>원본과 달라진 점<input name="changeNote" defaultValue={q.changeNote} placeholder="예: 질문형 첫 문장, 노란 큰자막으로 변경" /></label>
                <label>캡션<textarea name="caption" rows={2} defaultValue={q.caption} /></label>
                <label>영상
                  <select name="renderId" defaultValue={q.renderId ?? ''}>
                    <option value="">자막 편집기에서 만든 영상 없음</option>
                    {renders.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                </label>
              </div>
              <div className="row-actions">
                <IntentButton className="btn btn-main" intent="approve">승인</IntentButton>
                <IntentButton className="btn" intent="save">초안 저장</IntentButton>
                <button className="link-btn danger" type="submit" formAction={async () => { 'use server'; await deleteVariant(q.id); }}>삭제</button>
              </div>
            </ActionForm>
          );
        }) : <p className="empty-line">승인을 기다리는 변형본이 없어요. 아래 후보에서 만들어 주세요.</p>}
      </section>

      <section>
        <div className="sec-head">
          <h2>{cur} 상위 릴스</h2>
          <div className="seg seg-wrap" role="group" aria-label="달">
            {months.slice(0, 6).map((m) => <Link key={m} href={`/studio/trial?month=${m}`} aria-current={m === cur ? 'true' : undefined}>{m}</Link>)}
          </div>
        </div>
        <p className="hint">같은 영상을 그대로 다시 올리면 도달이 줄 수 있어서, 첫 문장이나 자막을 바꾼 변형본만 승인할 수 있어요.</p>
        {candidates.length ? (
          <table className="tbl">
            <thead><tr><th>릴스</th><th className="num">조회수</th><th className="num">이달 중앙값 대비</th><th></th></tr></thead>
            <tbody>
              {candidates.map(({ post, multiple }) => (
                <tr key={post.id}>
                  <td><span className="cell-title">{post.title}</span><span className="sub">{post.date}{post.hookType ? `, ${post.hookType}` : ''}</span></td>
                  <td className="num">{views(post).toLocaleString('ko-KR')}</td>
                  <td className="num">{multiple.toFixed(1)}배</td>
                  <td className="num"><VariantButton id={post.id} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="empty-line">{cur}에 수치가 입력된 릴스가 없어요.</p>}
      </section>

      <section>
        <div className="sec-head">
          <h2>예약 {scheduled.length}개</h2>
          <ActionForm action={async () => { 'use server'; return runDueNow(); }} className="inline"><button className="btn btn-small" type="submit">게시 시간 확인</button></ActionForm>
        </div>
        <p className="hint">게시 시간: 매일 {creator.slots.join(', ')} (한국 시간). 인물·카드뉴스 메뉴에서 바꿀 수 있어요.</p>
        {scheduled.length ? (
          <ul className="list">
            {scheduled.map((q) => (
              <li key={q.id}>
                <span className="when">{fmtDateTimeKST(q.scheduledAt!)}</span>
                <span className="cell-title">{q.hook}<small>{q.changeNote}</small></span>
                <form action={async () => { 'use server'; await unapproveVariant(q.id); }}><button className="link-btn" type="submit">승인 취소</button></form>
              </li>
            ))}
          </ul>
        ) : <p className="empty-line">예약된 변형본이 없어요.</p>}
      </section>

      {posted.length > 0 && (
        <section>
          <h2>테스트 게시 기록</h2>
          <ul className="list">
            {posted.slice(0, 20).map((q) => (
              <li key={q.id}>
                <span className="when">{fmtDateTimeKST(q.postedAt!)}</span>
                <span className="cell-title">{q.hook}<small>{q.changeNote}</small></span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
