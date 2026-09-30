import Link from 'next/link';
import Calculator from './Calculator';
import { FEES } from '@/lib/fees';

const FLOW = [
  { who: 'buyer', whoLabel: '구매자', title: '구매 요청 등록', desc: '물품 링크·수량·희망 보상금을 올려요. 등록할 때 면세 가드가 금지 품목과 한도를 바로 검사해요.' },
  { who: 'traveler', whoLabel: '여행자', title: '여행 일정 등록 · 수락', desc: '출발지·도착지·날짜를 올리면 경로가 맞는 요청이 자동으로 추천돼요.' },
  { who: 'platform', whoLabel: '플랫폼', title: '에스크로 결제', desc: '구매자가 물품비+보상금+수수료를 결제하면 플랫폼이 대금을 보관해요.' },
  { who: 'traveler', whoLabel: '여행자', title: '현지 매장에서 직접 구매', desc: '영수증 첨부가 필수예요. 남이 포장한 짐은 절대 받지 않아요.' },
  { who: 'buyer', whoLabel: '구매자', title: '전달 · 수령 확인', desc: '현장 사진과 함께 전달하고, 구매자가 확인하면 여행자에게 정산돼요.' },
];

export default function P2PHome() {
  return (
    <main className="page">
      <section className="hero">
        <div>
          <span className="chip chip-ok" style={{ marginBottom: 14 }}>P2P 크라우드 쇼핑 · 데모</span>
          <h1>
            직구 배송비 대신 <em>여행자</em>에게,
            <br />
            캐리어 빈 공간은 <em>여행비</em>로.
          </h1>
          <p className="hero-lead">
            국내에서 구하기 힘든 물건을 그 나라에서 오는 여행자가 직접 사다 줘요. 대금은 전달이 끝날 때까지 플랫폼이
            보관하고, 나라별 면세 한도와 반입 금지 품목은 시스템이 먼저 걸러 줘요.
          </p>
          <div className="hero-cta">
            <Link className="btn btn-primary" href="/requests">사고 싶은 물건 요청하기</Link>
            <Link className="btn" href="/trips">여행 일정 올리고 돈 벌기</Link>
          </div>
        </div>
        <div className="card-flush flow-card" aria-label="거래 흐름">
          {FLOW.map((f, i) => (
            <div key={f.title} className="flow-row">
              <span className="flow-num">{i + 1}</span>
              <div>
                <strong>
                  {f.title}
                  <span className={`who who-${f.who}`}>{f.whoLabel}</span>
                </strong>
                <span>{f.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>누구에게 좋은가요</h2>
        </div>
        <div className="grid-3">
          <div className="card value">
            <span className="eyebrow">구매자</span>
            <h3>배송비·관세를 줄이고, 못 구하던 물건까지</h3>
            <ul>
              <li>비싼 국제 특송비 대신 여행자 보상금만</li>
              <li>현지 매장 전용·한정판·배대지 불가 식품도 가능</li>
              <li>예상 관세를 결제 전에 미리 확인</li>
            </ul>
          </div>
          <div className="card value">
            <span className="eyebrow">여행자</span>
            <h3>남는 수하물 공간을 여행비로</h3>
            <ul>
              <li>이미 가는 경로에서 가능한 요청만 골라 수락</li>
              <li>작고 비싼 물건일수록 보상금이 커요</li>
              <li>면세 한도·금지 품목 자동 확인으로 세관 걱정 없음</li>
            </ul>
          </div>
          <div className="card value">
            <span className="eyebrow">글로벌 네트워크</span>
            <h3>여러 나라를 잇는 롱테일 시장</h3>
            <ul>
              <li>세계 여행자가 A국 물건을 B국으로 잇는 거점</li>
              <li>정식 수입이 안 되는 소수 취향 수요를 흡수</li>
              <li>K-뷰티·K-푸드 역방향 수요도 함께</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>안전장치</h2>
          <span>신뢰가 곧 서비스예요</span>
        </div>
        <div className="grid-4">
          <div className="card value">
            <h3>면세 자동 가드</h3>
            <p className="small muted">도착 국가 면세 한도를 여행자 한 명 기준으로 합산해서, 초과하면 관세 선결제로만 진행돼요.</p>
          </div>
          <div className="card value">
            <h3>직접 구매 원칙</h3>
            <p className="small muted">여행자가 매장에서 영수증을 받고 직접 산 물건만 운반해요. 포장된 남의 짐은 금지예요.</p>
          </div>
          <div className="card value">
            <h3>에스크로 정산</h3>
            <p className="small muted">수령 확인 전까지 대금은 플랫폼이 보관해요. 여행자가 오지 않으면 전액 환불돼요.</p>
          </div>
          <div className="card value">
            <h3>신원 인증 · 상호 평가</h3>
            <p className="small muted">여권·휴대폰 인증을 거친 여행자에게 인증 배지를 달고, 거래 후 서로 평가해요.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>면세 한도 계산기</h2>
          <Link className="small" href="/customs">나라별 규정 전체 보기</Link>
        </div>
        <Calculator />
      </section>

      <section className="section">
        <div className="section-head">
          <h2>수수료</h2>
        </div>
        <div className="grid-3">
          <div className="card">
            <div className="stat-num">{FEES.buyerRate * 100}%</div>
            <div className="stat-label">구매자 서비스 수수료 (물품 금액 기준, 최소 ${FEES.buyerMin})</div>
          </div>
          <div className="card">
            <div className="stat-num">{FEES.travelerRate * 100}%</div>
            <div className="stat-label">여행자 수수료 (보상금에서 차감)</div>
          </div>
          <div className="card">
            <div className="stat-num">0원</div>
            <div className="stat-label">매칭 안 되면 결제되지 않아요. 취소 시 보관 대금 전액 환불</div>
          </div>
        </div>
      </section>

      <section className="pitch">
        <small>ONE-LINE PITCH</small>
        소비자에게는 직구 배송비와 관세를 줄여 주고, 세계 여행자에게는 수하물 여유 공간으로 비행기 값을 벌게 해 주는 P2P
        글로벌 크라우드 쇼핑 플랫폼.
      </section>
    </main>
  );
}
