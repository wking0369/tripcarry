import { adminConfigured, isAdmin } from '@/lib/admin';
import { DEPLOY_VERSION, readEvents, readSignups, readTestEmails, storage, type Signup } from '@/lib/data';
import { DROPS } from '@/lib/drops';
import { DICT, LANG_LABEL, countryName, isLang } from '@/lib/i18n';

export const metadata = { title: '수요 조사 결과', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

// 미리 정해 둔 "수요 있음" 판단 기준
const GOALS = { visitors: 300, signups: 30, travelers: 10 };

const ROLE_LABEL: Record<Signup['role'], string> = { buyer: '구매자', traveler: '공급자', both: '둘 다' };
const M = DICT.ko.modal;
const label = (map: Record<string, string>, k?: string) => (k && map[k]) || '';

/** 투자자에게 보여줄 때: ab***@naver.com */
function maskEmail(e: string) {
  const [user, domain] = e.split('@');
  return `${user.slice(0, 2)}***@${domain ?? ''}`;
}

function routeKey(s: Signup) {
  if (s.from === 'JP' && s.to === 'KR') return '도쿄 → 서울';
  if (s.from === 'KR' && s.to === 'JP') return '서울 → 도쿄';
  if (!s.from && !s.to) return '';
  return `${countryName(s.from, 'ko') || '?'} → ${countryName(s.to, 'ko') || '?'}`;
}

function Bars({ rows, unit }: { rows: [string, number][]; unit: string }) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rows.length === 0 ? <p className="muted small">아직 없어요.</p> : rows.map(([k, n]) => (
        <div key={k} className="bar-row">
          <span>{k}</span>
          <span className="bar-track"><span style={{ width: `${(n / max) * 100}%` }} /></span>
          <span>{n}{unit}</span>
        </div>
      ))}
    </div>
  );
}

function count<T>(list: T[], key: (x: T) => string) {
  const m = new Map<string, number>();
  for (const x of list) {
    const k = key(x);
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function pct(a: number, b: number) {
  return b > 0 ? `${((a / b) * 100).toFixed(1)}%` : '—';
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string; mask?: string }> }) {
  const { error, mask: maskParam } = await searchParams;
  const mask = maskParam === '1';

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

  const [allEvents, allSignups, tests] = await Promise.all([readEvents(), readSignups(), readTestEmails()]);
  // 테스트로 표시한 이메일의 등록과, 그 브라우저의 방문·클릭은 통계에서 뺀다
  const testVids = new Set(allSignups.filter((s) => tests.has(s.email) && s.vid).map((s) => s.vid));
  const signups = allSignups.filter((s) => !tests.has(s.email));
  const events = allEvents.filter((e) => !testVids.has(e.vid));

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
    const key = routeKey(s);
    if (key) routes.set(key, (routes.get(key) ?? 0) + 1);
  }
  const srcRows = [...bySrc.values()].sort((a, b) => b.visitors.size - a.visitors.size || b.signups - a.signups);
  const topRoutes = [...routes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const pays = signups.map((s) => Number(s.pay)).filter((n) => Number.isFinite(n) && n > 0);
  const avgPay = pays.length ? pays.reduce((a, b) => a + b, 0) / pays.length : 0;

  // "이거 원해요": 품목별로 누른 브라우저 수
  const wants = new Map<string, Set<string>>();
  for (const e of events) {
    if (e.type !== 'want' || !e.cta) continue;
    if (!wants.has(e.cta)) wants.set(e.cta, new Set());
    wants.get(e.cta)!.add(e.vid);
  }
  const wantRows: [string, number][] = DROPS.map((d) => [d.name.ko, wants.get(d.id)?.size ?? 0] as [string, number])
    .filter((r) => r[1] > 0)
    .sort((a, b) => b[1] - a[1]);

  // 공급자 답변
  const carriers = signups.filter((s) => s.role !== 'buyer');
  const minPays = carriers.map((s) => Number(s.minPay)).filter((n) => Number.isFinite(n) && n > 0);
  const avgMinPay = minPays.length ? minPays.reduce((a, b) => a + b, 0) / minPays.length : 0;
  const frequent = carriers.filter((s) => s.trips === '6-11' || s.trips === '12+').length;
  const langRows = count(signups, (s) => (isLang(s.lang) ? LANG_LABEL[s.lang] : s.lang || '?'));

  const goals = [
    { label: '방문자', value: allVisitors.size, goal: GOALS.visitors },
    { label: '사전 등록', value: signups.length, goal: GOALS.signups },
    { label: '공급자 등록', value: travelers, goal: GOALS.travelers },
  ];
  const met = goals.every((g) => g.value >= g.goal);

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1>수요 조사 결과</h1>
          <p>방문·클릭은 브라우저 기준으로 중복을 뺐어요. 같은 이메일로 다시 등록하면 마지막 것만 세요.</p>
          <p className="tiny muted">배포 버전 <code>{DEPLOY_VERSION}</code> · 저장 공간 {storage.persistent ? '연결됨 ✓' : '연결 안 됨 ✕'}{tests.size > 0 && <> · 테스트 {allSignups.length - signups.length}명 제외</>}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a className="btn btn-sm" href={mask ? '/admin' : '/admin?mask=1'}>{mask ? '이메일 보이기' : '투자자용 (이메일 가리기)'}</a>
          <a className="btn btn-sm" href="/studio">마케팅 스튜디오</a>
          <a className="btn btn-sm" href="/api/admin/export">CSV 받기</a>
          <form method="post" action="/api/admin/logout"><button className="btn btn-ghost btn-sm" type="submit">로그아웃</button></form>
        </div>
      </div>

      {!storage.persistent ? (
        <div className="notice notice-warn">
          <b>저장 공간 문제:</b> {storage.message}
          <ol style={{ margin: '8px 0 0', paddingLeft: 20 }}>
            <li>Railway에서 tripcarry 서비스 카드를 우클릭 → <b>Attach Volume</b> → Mount path <code>/data</code></li>
            <li>Variables의 <code>DATA_DIR</code>은 <code>/data</code>로 두거나 지워도 돼요 (Volume 경로를 자동으로 써요)</li>
            <li>다시 배포된 뒤 이 화면에서 이 경고가 사라지면 연결된 거예요</li>
          </ol>
        </div>
      ) : (
        storage.message && <div className="notice notice-info small">{storage.message}</div>
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
        <div className="card"><div className="stat-num">{buyers} / {travelers}</div><div className="stat-label">구매자 / 공급자 (둘 다는 양쪽 포함)</div></div>
        <div className="card"><div className="stat-num">{avgPay ? `$${avgPay.toFixed(0)}` : '—'}</div><div className="stat-label">평균 보상금 ({pays.length}명 응답)</div></div>
      </div>

      <section className="section">
        <div className="section-head"><h2>유입 경로별</h2><span>링크에 ?src=이름 을 붙이면 따로 집계돼요</span></div>
        <div className="card-flush table-wrap">
          <table className="table">
            <thead>
              <tr><th>유입 경로</th><th>방문자</th><th>버튼 클릭</th><th>등록</th><th>전환율</th><th>구매자</th><th>공급자</th></tr>
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

      <section className="section">
        <div className="section-head"><h2>한정품 관심</h2><span>&quot;이거 원해요&quot;를 누른 사람 수 (브라우저 기준)</span></div>
        <Bars rows={wantRows} unit="명" />
      </section>

      <section className="section">
        <div className="section-head"><h2>공급자</h2><span>가져다줄 수 있다고 등록한 {carriers.length}명의 답변</span></div>
        <div className="grid-4">
          <div className="card"><div className="stat-num">{carriers.length}</div><div className="stat-label">공급자 등록</div></div>
          <div className="card"><div className="stat-num">{frequent}</div><div className="stat-label">연 6회 이상 왕복</div></div>
          <div className="card"><div className="stat-num">{carriers.filter((s) => s.kind === 'resident').length}</div><div className="stat-label">현지 거주</div></div>
          <div className="card"><div className="stat-num">{avgMinPay ? `$${avgMinPay.toFixed(0)}` : '—'}</div><div className="stat-label">건당 최소 보상금 평균 ({minPays.length}명 응답)</div></div>
        </div>
        <div className="grid-3" style={{ alignItems: 'start' }}>
          <div><h3 className="small muted" style={{ margin: '0 0 6px' }}>어떤 분인가</h3><Bars rows={count(carriers, (s) => label(M.kinds, s.kind))} unit="명" /></div>
          <div><h3 className="small muted" style={{ margin: '0 0 6px' }}>1년 왕복 횟수</h3><Bars rows={count(carriers, (s) => label(M.tripsOpts, s.trips))} unit="명" /></div>
          <div><h3 className="small muted" style={{ margin: '0 0 6px' }}>짐 여유</h3><Bars rows={count(carriers, (s) => label(M.kgOpts, s.kg))} unit="명" /></div>
        </div>
      </section>

      <div className="grid-3" style={{ alignItems: 'start' }}>
        <section className="section">
          <div className="section-head"><h2>방향</h2></div>
          <Bars rows={topRoutes} unit="명" />
        </section>
        <section className="section">
          <div className="section-head"><h2>언어</h2></div>
          <Bars rows={langRows} unit="명" />
        </section>
        <section className="section">
          <div className="section-head"><h2>누른 버튼</h2></div>
          <Bars rows={[...ctaCount.entries()].sort((a, b) => b[1] - a[1])} unit="회" />
        </section>
      </div>

      <section className="section">
        <div className="section-head"><h2>최근 등록</h2><span>{allSignups.length}명 · 내가 넣은 테스트는 &quot;테스트&quot;를 눌러 통계에서 빼세요</span></div>
        <div className="card-flush table-wrap">
          <table className="table">
            <thead>
              <tr><th>시각(서울)</th><th>이메일</th><th>역할</th><th>방향</th><th>물건</th><th>보상금</th><th>공급자 정보</th><th>유입</th><th></th></tr>
            </thead>
            <tbody>
              {allSignups.length === 0 ? (
                <tr><td colSpan={9} className="muted">아직 등록이 없어요.</td></tr>
              ) : (
                allSignups.slice(0, 200).map((s) => {
                  const isTest = tests.has(s.email);
                  const carrier = [label(M.kinds, s.kind), label(M.tripsOpts, s.trips) && `연 ${label(M.tripsOpts, s.trips)}`, label(M.kgOpts, s.kg), s.minPay && `최소 $${s.minPay}`].filter(Boolean).join(' · ');
                  return (
                    <tr key={s.email} className={isTest ? 'row-test' : undefined}>
                      <td style={{ whiteSpace: 'nowrap' }}>{fmtTime(s.at)}</td>
                      <td>{mask ? maskEmail(s.email) : s.email}</td>
                      <td>{ROLE_LABEL[s.role]}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{routeKey(s) || '—'}</td>
                      <td>{s.item || '—'}</td>
                      <td>{s.pay ? `$${s.pay}` : '—'}</td>
                      <td className="small">{carrier || '—'}</td>
                      <td>{s.src}</td>
                      <td>
                        <form method="post" action="/api/admin/test-email">
                          <input type="hidden" name="email" value={s.email} />
                          <input type="hidden" name="on" value={isTest ? '0' : '1'} />
                          {mask && <input type="hidden" name="mask" value="1" />}
                          <button type="submit" className={`chip chip-btn ${isTest ? 'chip-warn' : 'chip-neutral'}`}>{isTest ? '테스트 ✓' : '테스트'}</button>
                        </form>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
