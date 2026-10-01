import { cookies } from 'next/headers';
import { LANG_COOKIE, toLang } from '@/lib/i18n';

export const metadata = { title: 'Terms' };

// 출시 전 초안. 정식 서비스 전에 변호사·관세사 검토를 받아야 한다.
export default async function TermsPage() {
  const lang = toLang((await cookies()).get(LANG_COOKIE)?.value);
  return lang === 'en' ? <TermsEn /> : <TermsKo />;
}

function TermsKo() {
  return (
    <main className="page terms">
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>TripCarry 이용약관</h1>
        <p className="muted small">초안 · 2026-10-01 · 정식 출시 전 법률 검토를 거쳐 확정돼요.</p>
      </div>

      <section className="section">
        <h2>제1조 (목적)</h2>
        <p>이 약관은 TripCarry(이하 “회사”)가 제공하는 구매자–여행자 매칭 및 에스크로 결제 서비스(이하 “서비스”)의 이용 조건과 절차, 회사와 이용자의 권리·의무를 정합니다.</p>
      </section>

      <section className="section">
        <h2>제2조 (용어)</h2>
        <ol>
          <li>“구매자”는 해외 물품의 구매·전달을 요청하는 이용자입니다.</li>
          <li>“여행자”는 자신의 여행 경로에서 요청 물품을 직접 구매하여 휴대·전달하는 이용자입니다.</li>
          <li>“에스크로”는 구매자가 결제한 대금을 회사가 전달 확인 시까지 보관한 뒤 정산하는 방식입니다.</li>
        </ol>
      </section>

      <section className="section key">
        <h2>제3조 (회사의 지위 및 면책)</h2>
        <ol>
          <li>회사는 구매자와 여행자 간의 매칭 및 에스크로 결제 시스템만을 제공하는 <b>중개자</b>이며, 거래의 당사자가 아닙니다.</li>
          <li>회사는 여행자가 휴대하여 반입하는 물품의 <b>통관, 세관 신고, 관세 납부의 직접적인 주체가 아닙니다.</b></li>
          <li>회사가 제공하는 면세 한도·반입 금지 품목 안내는 참고 정보이며, 최종 판단과 책임은 각국 세관 법령에 따라 이용자에게 있습니다.</li>
        </ol>
      </section>

      <section className="section key">
        <h2>제4조 (관세 및 세금의 부담)</h2>
        <ol>
          <li>거래 물품과 관련하여 발생하는 모든 정식 관세, 부가가치세 및 세관 수수료는 <b>구매자가 부담하는 것을 원칙</b>으로 합니다. 단, 구매자와 여행자가 거래 전에 서비스 안에서 달리 합의한 경우 그 조건에 따릅니다.</li>
          <li>면세 한도를 초과하는 거래는 예상 세액을 결제 시 함께 납부(선결제)하는 조건으로만 진행할 수 있으며, 실제 세액과의 차액은 영수증 확인 후 정산합니다.</li>
        </ol>
      </section>

      <section className="section key">
        <h2>제5조 (여행자의 세관 법규 준수 및 자진 신고 의무)</h2>
        <ol>
          <li>여행자는 출국 및 입국 국가의 세관 법률을 준수해야 하며, 면세 한도를 초과하거나 신고 대상인 물품은 반드시 자진 신고해야 합니다.</li>
          <li>세관 신고서에 허위 사실을 기재하거나 신고를 누락하여 발생하는 가산세, 압수, 처벌 등 모든 불이익은 <b>여행자 본인에게 책임</b>이 있습니다.</li>
          <li>여행자는 요청 물품을 현지 매장 등에서 직접 구매하고 영수증을 첨부해야 하며, 타인이 포장하거나 봉인한 물품을 대신 운반해서는 안 됩니다.</li>
        </ol>
      </section>

      <section className="section key">
        <h2>제6조 (금지·제한 품목 및 위반 시 조치)</h2>
        <ol>
          <li>회사가 지정한 반입 금지·제한 품목(육류·육가공품, 생과일·종자, 모조품, 무기류, 마약류 및 각국 법령상 금지 품목 등)은 요청·운반할 수 없습니다.</li>
          <li>이용자가 금지 품목을 무단 운반하거나 서비스를 밀수 목적으로 이용한 경우, 회사는 다음 조치를 할 수 있습니다.
            <ol>
              <li>해당 거래의 에스크로 대금 정산 중단 및 지급 보류</li>
              <li>계정 영구 정지 및 재가입 제한</li>
              <li>관계 법령에 따른 수사기관·세관 등 관련 기관에 대한 정보 제공</li>
            </ol>
          </li>
        </ol>
      </section>

      <section className="section">
        <h2>제7조 (에스크로 결제 및 정산)</h2>
        <ol>
          <li>구매자는 매칭 후 물품 대금, 여행자 보상금, 서비스 수수료(및 해당 시 예상 세액)를 회사에 결제합니다.</li>
          <li>회사는 구매자가 수령을 확인한 때 여행자에게 대금을 정산합니다. 여행자가 물품을 전달하지 않으면 구매자에게 보관 대금 전액을 환불합니다.</li>
        </ol>
      </section>

      <section className="section">
        <h2>제8조 (분쟁 처리)</h2>
        <p>물품 파손·분실·상이 등 분쟁이 생기면 회사는 영수증, 전달 사진, 대화 기록을 바탕으로 조정을 도울 수 있으나, 거래의 1차 책임은 당사자에게 있습니다.</p>
      </section>

      <p className="tiny muted">현재 TripCarry는 출시 전으로, 실제 거래·결제는 이루어지지 않아요. 사전 등록 정보 처리는 개인정보 처리방침을 따릅니다.</p>
    </main>
  );
}

function TermsEn() {
  return (
    <main className="page terms">
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>TripCarry Terms of Service</h1>
        <p className="muted small">Draft · 2026-10-01 · To be finalized after legal review before launch.</p>
      </div>

      <section className="section">
        <h2>1. Purpose</h2>
        <p>These terms govern the buyer–traveler matching and escrow payment service (the “Service”) provided by TripCarry (the “Company”).</p>
      </section>

      <section className="section">
        <h2>2. Definitions</h2>
        <ol>
          <li>“Buyer” means a user who requests an item from abroad.</li>
          <li>“Traveler” means a user who buys the requested item in person along their route and carries it to the buyer.</li>
          <li>“Escrow” means the Company holds the buyer’s payment until delivery is confirmed, then settles it.</li>
        </ol>
      </section>

      <section className="section key">
        <h2>3. The Company’s role and disclaimer</h2>
        <ol>
          <li>The Company is an <b>intermediary</b> that only provides matching and an escrow payment system between buyers and travelers, and is not a party to the transaction.</li>
          <li>The Company is <b>not the party responsible for customs clearance, customs declarations or payment of duties</b> for items carried by travelers.</li>
          <li>Duty-free limits and prohibited-item guidance are provided for reference only. Users remain responsible under each country’s customs laws.</li>
        </ol>
      </section>

      <section className="section key">
        <h2>4. Duties and taxes</h2>
        <ol>
          <li>All official customs duties, VAT and customs fees are, as a rule, <b>paid by the buyer</b>, unless the buyer and traveler agree otherwise within the Service before the transaction.</li>
          <li>Transactions over the duty-free limit may only proceed with the estimated duty prepaid at checkout; any difference is settled against the official receipt.</li>
        </ol>
      </section>

      <section className="section key">
        <h2>5. Traveler’s duty to comply and declare</h2>
        <ol>
          <li>Travelers must comply with the customs laws of the departure and arrival countries and must declare items over the duty-free limit or otherwise subject to declaration.</li>
          <li>Any penalties, seizures or other consequences arising from false or missing customs declarations are <b>the traveler’s sole responsibility</b>.</li>
          <li>Travelers must buy requested items themselves (e.g. in-store) with a receipt, and must never carry items packed or sealed by others.</li>
        </ol>
      </section>

      <section className="section key">
        <h2>6. Prohibited items and enforcement</h2>
        <ol>
          <li>Items designated as prohibited or restricted (meat products, fresh produce and seeds, counterfeits, weapons, drugs, and anything banned by applicable law) may not be requested or carried.</li>
          <li>If a user carries prohibited items or uses the Service for smuggling, the Company may:
            <ol>
              <li>suspend settlement of and withhold the escrow funds for that transaction;</li>
              <li>permanently suspend the account and block re-registration;</li>
              <li>provide information to customs, law enforcement or other relevant authorities as permitted by law.</li>
            </ol>
          </li>
        </ol>
      </section>

      <section className="section">
        <h2>7. Escrow payment and settlement</h2>
        <ol>
          <li>After a match, the buyer pays the item price, traveler reward, service fee (and estimated duty, if applicable) to the Company.</li>
          <li>Funds are released to the traveler when the buyer confirms receipt. If the traveler does not deliver, the buyer is fully refunded.</li>
        </ol>
      </section>

      <section className="section">
        <h2>8. Disputes</h2>
        <p>For damage, loss or mismatched items, the Company may help mediate using receipts, delivery photos and message history, but the parties to the transaction bear primary responsibility.</p>
      </section>

      <p className="tiny muted">TripCarry has not launched yet and no real transactions or payments take place. Waitlist data is handled under our Privacy policy.</p>
    </main>
  );
}
