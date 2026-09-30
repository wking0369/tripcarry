import { adminConfigured, isAdmin } from '@/lib/admin';
import { hasPersistentStorage, readEvents, readSignups, type Signup } from '@/lib/data';
import { countryName } from '@/lib/i18n';

export const metadata = { title: '수요 조사 결과', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

// 미리 정해 둔 "수요 있음" 판단 기준
const GOALS = { visitors: 300, signups: 30, travelers: 10 };

const ROLE_LABEL: Record<Signup['role'], string> = { buyer: '구매자', traveler: '여행자', both: '둘 다' };

function pct(a: number, b: number) {
  return b > 0 ? `${((a / b) * 100).toFixed(1)}%` : '—';
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  if (!adminConfigured()) {
    return (
      <main className="page" style={{ maxWidth: 560 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>수요 조사 결과</h1>
        <div className="notice notice-warn">Railway 변수에 <code>ADMIN_PASSWORD</code>를 추가하면 이 화면을 쓸 수 있어요.</div>
      </main>
    );
  }

  if (!(await isAdmin())) {
    return (
      <main className="login-wrap">
        <form className="card login-card" method="post" action="/api/admin/login">
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>수요 조사 결과</h1>
          <div className="field">
            <label htmlFor="pw">관리자 비밀번호</label>
            <input id="pw" name="password" type="password" className="input" required autoFocus />
          </div>
          {error && <div className="notice notice-warn">{error === 'wait' ? '잠시 후 다시 시도해 주세요.' : '비밀번호가 맞지 않아요.'}</div>}
          <button className="btn btn-primary" type="submit">들어가기</button>
        </form>
      </main>
    );
  }

  const [events, signups] = await Promise.all([readEvents(), readSignups()]);

  // 유입 경로별 집계: 방문자는 브라우저 ID 기준 중복 제거
  type Row = { src: string; visitors: Set<string>; clickers: Set<string>; signups: number; buyers: number; travelers: number };
  const bySrc = new Map<string, Row>();
  const row = (src: string) => {
    let r = bySrc.get(src);
    if (!r) bySrc.set(src, (r = { src, visitors: new Set(), clickers: new Set(), signups: 0, buyers: 0, travelers: 0 }));
    return r;
  };
  const allVisitors = new Set<string>();
  const allClickers = new Set<string>();
  const ctaCount = new Map<string, number>();
  for (const e of events) {
    if (e.type === 'visit') {
      row(e.src).visitors.add(e.vid);
      allVisitors.add(e.vid);
    } else if (e.type === 'cta') {
      row(e.src).clickers.add(e.vid);
      allClickers.add(e.vid);
      if (e.cta) ctaCount.set(e.cta, (ctaCount.get(e.cta) ?? 0) + 1);
    }
  }
  let buyers = 0;
  let travelers = 0;
  const routes = new Map<string, number>();
  for (const s of signups) {
    const r = row(s.src);
    r.signups += 1;
    if (s.role !== 'traveler') { r.buyers += 1; buyers += 1; }
    if (s.role !== 'buyer') { r.travelers += 1; travelers += 1; }
    if (s.from || s.to) {
      const key = `${countryName(s.from, 'ko') || '?'} → ${countryName(s.to, 'ko') || '?'}`;
      routes.set(key, (routes.get(key) ?? 0) + 1);
    }
  }
  const srcRows = [...bySrc.values()].sort((a, b) => b.visitors.size - a.visitors.size || b.signups - a.signups);
  const topRoutes = [...routes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const maxRoute = topRoutes[0]?.[1] ?? 1;
  const pays = signups.map((s) => Number(s.pay)).filter((n) => Number.isFinite(n) && n > 0);
  const avgPay = pays.length ? pays.reduce((a, b) => a + b, 0) / pays.length : 0;

  const goals = [
    { label: '방문자', value: allVisitors.size, goal: GOALS.visitors },
    { label: '사전 등록', value: signups.length, goal: GOALS.signups },
    { label: '여행자 등록', value: travelers, goal: GOALS.travelers },
  ];
  const met = goals.every((g) => g.value >= g.goal);

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1>수요 조사 결과</h1>
          <p>방문·클릭은 브라우저 기준으로 중복을 뺐어요. 같은 이메일로 다시 등록하면 마지막 것만 세요.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a className="btn btn-sm" href="/api/admin/export">CSV 받기</a>
          <form method="post" action="/api/admin/logout"><button className="btn btn-ghost btn-sm" type="submit">로그아웃</button></form>
        </div>
      </div>

      {!hasPersistentStorage && (
        <div className="notice notice-warn">
          저장 공간(Volume)이 연결되지 않았어요. 지금 기록은 재배포하면 사라져요. Railway에서 Volume을 붙이고 <code>DATA_DIR</code>을 설정해 주세요.
        </div>
      )}

      <section className="section">
        <div className="section-head">
          <h2>목표 대비</h2>
          <span className={`chip ${met ? 'chip-ok' : 'chip-neutral'}`}>{met ? '기준 달성 — 수요 있음' : '진행 중'}</span>
        </div>
        <div className="grid-3">
          {goals.map((g) => (
            <div key={g.label} className="card">
              <div className="stat-num">{g.value}<span className="muted" style={{ fontSize: 16, fontWeight: 500 }}> / {g.goal}</span></div>
              <div className="stat-label">{g.label}</div>
              <div className="progress" style={{ marginTop: 10 }}><span style={{ width: `${Math.min(100, (g.value / g.goal) * 100)}%` }} /></div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid-4">
        <div className="card"><div className="stat-num">{pct(allClickers.size, allVisitors.size)}</div><div className="stat-label">버튼 클릭률 (방문자 중)</div></div>
        <div className="card"><div className="stat-num">{pct(signups.length, allVisitors.size)}</div><div className="stat-label">등록 전환율 (5~10%면 양호)</div></div>
        <div className="card"><div className="stat-num">{buyers} / {travelers}</div><div className="stat-label">구매자 / 여행자 (둘 다는 양쪽 포함)</div></div>
        <div className="card"><div className="stat-num">{avgPay ? `$${avgPay.toFixed(0)}` : '—'}</div><div className="stat-label">평균 보상금 ({pays.length}명 응답)</div></div>
      </div>

      <section className="section">
        <div className="section-head"><h2>유입 경로별</h2><span>링크에 ?src=이름 을 붙이면 따로 집계돼요</span></div>
        <div className="card-flush table-wrap">
          <table className="table">
            <thead>
              <tr><th>유입 경로</th><th>방문자</th><th>버튼 클릭</th><th>등록</th><th>전환율</th><th>구매자</th><th>여행자</th></tr>
            </thead>
            <tbody>
              {srcRows.length === 0 ? (
                <tr><td colSpan={7} className="muted">아직 기록이 없어요.</td></tr>
              ) : (
                srcRows.map((r) => (
                  <tr key={r.src}>
                    <td><b>{r.src}</b></td>
                    <td>{r.visitors.size}</td>
                    <td>{r.clickers.size}</td>
                    <td>{r.signups}</td>
                    <td>{pct(r.signups, r.visitors.size)}</td>
                    <td>{r.buyers}</td>
                    <td>{r.travelers}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <section className="section">
          <div className="section-head"><h2>많이 원하는 경로</h2></div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topRoutes.length === 0 ? <p className="muted small">아직 없어요.</p> : topRoutes.map(([k, n]) => (
              <div key={k} className="bar-row">
                <span>{k}</span>
                <span className="bar-track"><span style={{ width: `${(n / maxRoute) * 100}%` }} /></span>
                <span>{n}명</span>
              </div>
            ))}
          </div>
        </section>
        <section className="section">
          <div className="section-head"><h2>어떤 버튼을 눌렀나</h2></div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ctaCount.size === 0 ? <p className="muted small">아직 없어요.</p> : [...ctaCount.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => (
              <div key={k} className="bar-row">
                <span>{k}</span>
                <span className="bar-track"><span style={{ width: `${(n / Math.max(...ctaCount.values())) * 100}%` }} /></span>
                <span>{n}회</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="section">
        <div className="section-head"><h2>최근 등록</h2><span>{signups.length}명</span></div>
        <div className="card-flush table-wrap">
          <table className="table">
            <thead>
              <tr><th>시각(서울)</th><th>이메일</th><th>역할</th><th>경로</th><th>물건</th><th>보상금</th><th>유입</th></tr>
            </thead>
            <tbody>
              {signups.length === 0 ? (
                <tr><td colSpan={7} className="muted">아직 등록이 없어요.</td></tr>
              ) : (
                signups.slice(0, 200).map((s) => (
                  <tr key={s.email}>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmtTime(s.at)}</td>
                    <td>{s.email}</td>
                    <td>{ROLE_LABEL[s.role]}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{s.from || s.to ? `${countryName(s.from, 'ko') || '?'} → ${countryName(s.to, 'ko') || '?'}` : '—'}</td>
                    <td>{s.item || '—'}</td>
                    <td>{s.pay ? `$${s.pay}` : '—'}</td>
                    <td>{s.src}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
