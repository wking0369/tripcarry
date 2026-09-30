import Calculator from '../Calculator';
import { CATEGORY_LIST, COUNTRY_LIST } from '@/lib/customs';

export const metadata = { title: '면세 계산기' };

const STATUS_TEXT = { ok: '가능', limit: '제한', block: '금지' } as const;
const STATUS_CHIP = { ok: 'chip-ok', limit: 'chip-warn', block: 'chip-danger' } as const;

export default function CustomsPage() {
  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1>면세 한도 계산기</h1>
          <p>도착 국가와 물품을 넣으면 면세 안전 구역·주의 구역·금지 구역으로 바로 알려 줘요.</p>
        </div>
      </div>

      <Calculator />

      <section className="section">
        <div className="section-head">
          <h2>나라별 일반 면세 한도</h2>
          <span>참고용 · 데모 고정 환율</span>
        </div>
        <div className="card-flush table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>나라</th>
                <th>면세 한도</th>
                <th>별도 면세 · 참고</th>
                <th>초과분 세율(추정)</th>
              </tr>
            </thead>
            <tbody>
              {COUNTRY_LIST.map((c) => (
                <tr key={c.code}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {c.flag} {c.name}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{c.allowanceNote}</td>
                  <td className="small muted">{c.extras.join(' · ')}</td>
                  <td>약 {Math.round(c.dutyRate * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>품목별 반입 규칙</h2>
        </div>
        <div className="card-flush">
          {CATEGORY_LIST.map((c) => (
            <div key={c.key} className="row">
              <span className={`chip ${STATUS_CHIP[c.status]}`} style={{ minWidth: 44, justifyContent: 'center' }}>
                {STATUS_TEXT[c.status]}
              </span>
              <div className="grow">
                <div style={{ fontWeight: 600, fontSize: 14 }}>{c.label}</div>
                {c.note && <div className="small muted">{c.note}</div>}
              </div>
            </div>
          ))}
        </div>
        <p className="notice notice-info">
          모조품·무기·마약류는 물품 이름만으로도 자동 차단돼요. 대리 구매 물품은 나라에 따라 “개인 휴대품”으로 인정되지
          않을 수 있어서, 정식 서비스 전에는 관세사·변호사 검토가 꼭 필요해요.
        </p>
      </section>
    </main>
  );
}
