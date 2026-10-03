import { currentDocLang } from '@/lib/lang';

export const metadata = { title: 'Privacy' };

export default async function PrivacyPage() {
  const lang = await currentDocLang();
  return (
    <main className="page" style={{ maxWidth: 760 }}>
      {lang === 'en' ? (
        <>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Privacy</h1>
          <p className="muted small">Last updated 2026-09-30</p>
          <section className="section">
            <p><strong>What we collect.</strong> If you join the waitlist: your email, and anything optional you choose to tell us (whether you’d buy or carry, the direction or countries, the item, a reward amount, and for carriers: what describes you, how often you travel, spare luggage space and your minimum reward). We also record anonymous page visits, button clicks and “I want this” taps with a random browser ID and the link you came from, so we can see which communities are interested. We don’t use advertising trackers or cookies from third parties.</p>
            <p><strong>Why.</strong> Only to measure interest before launch and to email you when TripCarry opens on your route. We don’t sell or share your data, and we don’t use it for advertising.</p>
            <p><strong>Your choices.</strong> Every email will include an unsubscribe link. To have your data deleted, reply to any of our emails or contact us, and we’ll remove it.</p>
            <p><strong>Storage.</strong> Data is stored on our hosting provider’s server and deleted if we decide not to launch.</p>
          </section>
        </>
      ) : (
        <>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>개인정보 처리방침</h1>
          <p className="muted small">최종 수정 2026-09-30</p>
          <section className="section">
            <p><strong>수집하는 정보.</strong> 사전 등록 시 이메일과, 선택해서 남겨 주신 정보(구매자/공급자 여부, 방향 또는 나라, 물건, 보상금, 공급자라면 거주 형태·왕복 횟수·짐 여유·최소 보상금)를 받아요. 어느 커뮤니티에서, 어떤 물건에 관심이 있는지 보기 위해 방문·버튼 클릭·&quot;이거 원해요&quot; 누름을 임의의 브라우저 ID와 유입 링크로 익명 기록해요. 광고 추적 도구나 외부 쿠키는 쓰지 않아요.</p>
            <p><strong>이용 목적.</strong> 출시 전 수요 확인과, 내 경로가 열렸을 때 메일로 알려 드리는 데만 써요. 판매·제3자 제공·광고 활용은 하지 않아요.</p>
            <p><strong>선택권.</strong> 모든 메일에 수신 거부 링크가 들어가요. 삭제를 원하시면 메일에 회신해 주시면 지워 드려요.</p>
            <p><strong>보관.</strong> 호스팅 서버에 보관하고, 출시하지 않기로 하면 삭제해요.</p>
          </section>
        </>
      )}
    </main>
  );
}
