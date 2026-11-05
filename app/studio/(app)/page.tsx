import Link from 'next/link';
import { BREAKOUT_MULTIPLE, GROUPINGS, engagementRate, followerRange, groupBy, inPeriod, latest, measured, median, views, weekly, withMultiple } from '@/lib/hub/analytics';
import { pickCreator, readHub } from '@/lib/hub/store';
import { KIND_LABEL, addDays, fmtNum, fmtPct, todayKST } from '@/lib/hub/types';
import { FollowerChart, WeeklyChart } from './charts';
import { currentCreatorId } from '@/lib/hub/current';

const RANGES = [
  { key: '14', label: '14일', days: 14 },
  { key: '30', label: '30일', days: 30 },
  { key: '90', label: '90일', days: 90 },
];

function change(cur: number, prev: number) {
  if (!prev) return null;
  const p = Math.round(((cur - prev) / prev) * 100);
  return `직전 기간보다 ${p >= 0 ? `${p}% 많아요` : `${-p}% 적어요`}`;
}

export default async function Analytics({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range } = await searchParams;
  const hub = await readHub();
  const creator = pickCreator(hub, await currentCreatorId());
  if (!creator) return null;
  const r = RANGES.find((x) => x.key === range) ?? RANGES[1];
  const to = todayKST();
  const from = addDays(to, -(r.days - 1));
  const all = hub.posts.filter((p) => p.creatorId === creator.id);
  const cur = inPeriod(all, from, to);
  const prev = inPeriod(all, addDays(from, -r.days), addDays(from, -1));
  const m = measured(cur);
  const base = median(measured(all).map(views));
  const f = followerRange(hub.followers.filter((p) => p.creatorId === creator.id), from, to);
  const totalViews = m.reduce((a, p) => a + views(p), 0);
  const prevViews = measured(prev).reduce((a, p) => a + views(p), 0);
  const ranked = withMultiple(m, base);
  const top = ranked.slice(0, 8);
  const maxTop = Math.max(1, ...top.map((x) => views(x.post)));
  const breakouts = ranked.filter((x) => x.multiple >= BREAKOUT_MULTIPLE).length;

  if (!all.length && !f.list.length) {
    return (
      <div className="empty">
        <h1>{creator.name} 계정에 쌓인 데이터가 없어요</h1>
        <p>게시물과 팔로워 수를 입력하면 여기서 분석해요.</p>
        <Link className="btn btn-main" href="/studio/data">수치 입력하기</Link>
      </div>
    );
  }

  return (
    <>
      <header className="page-head">
        <div>
          <h1>{creator.name}</h1>
          <p>{from} ~ {to}, 툴에 입력된 데이터 기준이에요. 조회수는 게시일이 기간에 든 게시물로 계산해요.</p>
        </div>
        <div className="seg" role="group" aria-label="기간">
          {RANGES.map((x) => <Link key={x.key} href={`/studio?range=${x.key}`} aria-current={x.key === r.key ? 'true' : undefined}>{x.label}</Link>)}
        </div>
      </header>

      <dl className="kpis">
        <div>
          <dt>팔로워 변화</dt>
          <dd>{f.delta === null ? '기록 부족' : `${f.delta >= 0 ? '+' : ''}${f.delta.toLocaleString('ko-KR')}`}</dd>
          <small>{f.end === null ? '입력 필요' : `현재 ${f.end.toLocaleString('ko-KR')}명`}</small>
        </div>
        <div>
          <dt>조회수</dt>
          <dd>{fmtNum(totalViews)}</dd>
          <small>{change(totalViews, prevViews) ?? '직전 기간 데이터 없음'}</small>
        </div>
        <div>
          <dt>수치 입력된 게시물</dt>
          <dd>{m.length}개</dd>
          <small>이 기간 전체 {cur.length}개</small>
        </div>
        <div>
          <dt>터진 게시물</dt>
          <dd>{breakouts}개</dd>
          <small>계정 중앙값({fmtNum(base)}회)의 {BREAKOUT_MULTIPLE}배 이상</small>
        </div>
        <div>
          <dt>반응률</dt>
          <dd>{fmtPct(engagementRate(m))}</dd>
          <small>좋아요·댓글·저장·공유 ÷ 도달</small>
        </div>
      </dl>

      <div className="two">
        <section>
          <h2>팔로워 수</h2>
          <FollowerChart data={f.list.map((x) => ({ date: x.date, followers: x.followers }))} />
        </section>
        <section>
          <h2>주별 조회수</h2>
          <WeeklyChart data={weekly(cur, from, to)} />
        </section>
      </div>

      <section>
        <div className="sec-head">
          <h2>가장 많이 본 게시물</h2>
          <Link href="/studio/archive">보관함 전체 보기</Link>
        </div>
        {top.length ? (
          <table className="tbl tbl-top">
            <thead>
              <tr><th>게시물</th><th>유형</th><th className="num">조회수</th><th className="num">평소 대비</th><th className="num">저장</th><th className="num">공유</th></tr>
            </thead>
            <tbody>
              {top.map(({ post, multiple }) => {
                const lm = latest(post)!;
                return (
                  <tr key={post.id}>
                    <td>
                      <span className="cell-title">{post.title}</span>
                      <span className="sub">{post.date}{post.topic ? `, ${post.topic}` : ''}</span>
                      <span className="minibar"><i style={{ width: `${(lm.views / maxTop) * 100}%` }} /></span>
                    </td>
                    <td>{KIND_LABEL[post.kind]}</td>
                    <td className="num">{lm.views.toLocaleString('ko-KR')}</td>
                    <td className="num">{multiple >= BREAKOUT_MULTIPLE ? <b className="hot">{multiple.toFixed(1)}배</b> : `${multiple.toFixed(1)}배`}</td>
                    <td className="num">{lm.saves.toLocaleString('ko-KR')}</td>
                    <td className="num">{lm.shares.toLocaleString('ko-KR')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : <p className="empty-line">이 기간에 수치가 입력된 게시물이 없어요.</p>}
      </section>

      <section>
        <h2>어떤 스타일이 잘 됐나</h2>
        <p className="hint">묶음별 조회수 중앙값이에요. 게시물이 3개 미만인 묶음은 우연일 수 있어요.</p>
        <div className="groups">
          {GROUPINGS.map((g) => {
            const rows = groupBy(m, g.key);
            const hi = Math.max(1, ...rows.map((x) => x.medianViews));
            return (
              <div key={g.name}>
                <h3>{g.name}</h3>
                {rows.length ? (
                  <ul className="rank">
                    {rows.slice(0, 6).map((row) => (
                      <li key={row.key} className={row.count < 3 ? 'few' : undefined}>
                        <span className="rank-key">{row.key}<small>{row.count}개{row.count < 3 ? ', 표본 적음' : ''}</small></span>
                        <span className="minibar"><i style={{ width: `${(row.medianViews / hi) * 100}%` }} /></span>
                        <span className="rank-val">{fmtNum(row.medianViews)}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="empty-line">입력된 값이 없어요.</p>}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
