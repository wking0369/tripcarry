import Link from 'next/link';
import { deleteReport } from '../../actions';
import { nextPeriod } from '@/lib/hub/scheduler';
import { pickCreator, readHub } from '@/lib/hub/store';
import { fmtNum, fmtPct, todayKST, type ReportNumbers } from '@/lib/hub/types';
import { currentCreatorId } from '@/lib/hub/current';
import GenerateButton from './GenerateButton';

export const metadata = { title: '2주 보고서' };

const AUTHOR: Record<string, string> = { ai: 'AI가 입력된 숫자로 작성', rules: 'AI 미연결: 규칙으로 만든 초안', mock: '연습 모드: 규칙으로 만든 초안' };

function delta(n: ReportNumbers) {
  if (!n.prevViews) return '직전 기간 데이터 없음';
  const p = Math.round(((n.views - n.prevViews) / n.prevViews) * 100);
  return `직전 같은 기간보다 ${p >= 0 ? `${p}% 많아요` : `${-p}% 적어요`}`;
}

export default async function Reports({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const hub = await readHub();
  const creator = pickCreator(hub, await currentCreatorId());
  if (!creator) return null;
  const list = hub.reports.filter((r) => r.creatorId === creator.id).sort((a, b) => (a.periodStart < b.periodStart ? 1 : -1));
  const r = list.find((x) => x.id === id) ?? list[0];
  const next = nextPeriod(creator, hub);
  const ended = next.end < todayKST();
  return (
    <>
      <header className="page-head">
        <div>
          <h1>2주 보고서</h1>
          <p>이번 기간은 {next.start} ~ {next.end}이에요. 끝나면 자동으로 만들어져요.</p>
        </div>
        <GenerateButton creatorId={creator.id} label={ended ? '보고서 만들기' : '중간 점검 만들기'} />
      </header>

      {list.length > 1 && (
        <div className="seg seg-wrap" role="group" aria-label="보고서">
          {list.map((x) => <Link key={x.id} href={`/studio/reports?id=${x.id}`} aria-current={x.id === r?.id ? 'true' : undefined}>{x.periodStart.slice(5)} ~ {x.periodEnd.slice(5)}{x.interim ? ' 중간' : ''}</Link>)}
        </div>
      )}

      {r ? (
        <article className="report">
          <header>
            <h2>{r.periodStart} ~ {r.periodEnd}{r.interim ? ' 중간 점검' : ''}</h2>
            <p className="hint">{AUTHOR[r.author]}{r.auto ? ', 자동 생성' : ''}. 숫자는 코드로 계산했어요.</p>
          </header>
          <p className="report-lead">{r.narrative.summary}</p>

          <dl className="kpis">
            <div><dt>팔로워 변화</dt><dd>{r.numbers.followerDelta === null ? '기록 부족' : `${r.numbers.followerDelta >= 0 ? '+' : ''}${r.numbers.followerDelta.toLocaleString('ko-KR')}`}</dd><small>{r.numbers.followersEnd === null ? '입력 필요' : `기간 끝 ${r.numbers.followersEnd.toLocaleString('ko-KR')}명`}</small></div>
            <div><dt>조회수</dt><dd>{fmtNum(r.numbers.views)}</dd><small>{delta(r.numbers)}</small></div>
            <div><dt>게시물</dt><dd>{r.numbers.measuredPosts}개</dd><small>수치 입력 기준, 전체 {r.numbers.posts}개</small></div>
            <div><dt>반응률</dt><dd>{fmtPct(r.numbers.engagementRate)}</dd><small>저장 {r.numbers.saves.toLocaleString('ko-KR')}, 공유 {r.numbers.shares.toLocaleString('ko-KR')}</small></div>
            <div><dt>트라이얼</dt><dd>{r.numbers.trialsPosted}개</dd><small>테스트 게시 기준</small></div>
          </dl>

          <div className="report-cols">
            <section><h3>터진 콘텐츠와 잘 된 점</h3><ul>{r.narrative.worked.map((x, i) => <li key={i}>{x}</li>)}</ul></section>
            <section><h3>아쉬운 점</h3><ul>{r.narrative.didnt.map((x, i) => <li key={i}>{x}</li>)}</ul></section>
            <section><h3>가져갈 스타일</h3><ul>{r.narrative.style.map((x, i) => <li key={i}>{x}</li>)}</ul></section>
            <section><h3>앞으로 나아갈 방향</h3><ul>{r.narrative.next.map((x, i) => <li key={i}>{x}</li>)}</ul></section>
          </div>

          {r.numbers.breakouts.length > 0 && (
            <section>
              <h3>이번 기간에 터진 게시물</h3>
              <table className="tbl">
                <thead><tr><th>게시물</th><th className="num">조회수</th><th className="num">평소 대비</th></tr></thead>
                <tbody>{r.numbers.breakouts.map((b) => <tr key={b.id}><td>{b.title}</td><td className="num">{b.views.toLocaleString('ko-KR')}</td><td className="num">{b.multiple}배</td></tr>)}</tbody>
              </table>
            </section>
          )}

          <section>
            <h3>묶음별 조회수 중앙값</h3>
            <div className="groups">
              {r.numbers.groups.map((g) => (
                <div key={g.name}>
                  <h4>{g.name}</h4>
                  {g.rows.length ? <ul className="plain">{g.rows.map((row) => <li key={row.key}><span>{row.key} <small>{row.count}개</small></span><b>{fmtNum(row.medianViews)}</b></li>)}</ul> : <p className="empty-line">입력된 값이 없어요.</p>}
                </div>
              ))}
            </div>
          </section>
          <form action={async () => { 'use server'; await deleteReport(r.id); }}><button className="link-btn danger" type="submit">이 보고서 삭제</button></form>
        </article>
      ) : (
        <div className="empty"><p>아직 보고서가 없어요. 기간이 끝나기 전에 보고 싶으면 위의 버튼으로 중간 점검을 만들어 주세요.</p></div>
      )}
    </>
  );
}
