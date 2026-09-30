import type { Metadata, Viewport } from 'next';
import '@fontsource/ibm-plex-sans-kr/400.css';
import '@fontsource/ibm-plex-sans-kr/500.css';
import '@fontsource/ibm-plex-sans-kr/600.css';
import '@fontsource/ibm-plex-sans-kr/700.css';
import './globals.css';
import './p2p.css';
import Nav from './Nav';

export const metadata: Metadata = {
  title: { default: 'TripCarry · 여행자 직구 매칭', template: '%s · TripCarry' },
  description: '구매자는 배송비와 관세 걱정을 덜고, 여행자는 캐리어 빈 공간으로 여행비를 버는 P2P 크라우드 쇼핑 플랫폼 (데모)',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

// 데모라서 서버 DB 없이 방문자 브라우저에만 데이터를 저장한다.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div className="p2p">
          <Nav />
          {children}
          <footer className="p2p-footer">
            <p>
              TripCarry는 아이디어 검증용 데모예요. 결제·신원 인증은 흉내만 내고, 입력한 데이터는 이 브라우저에만 저장돼요.
            </p>
            <p>면세 한도와 반입 규정은 참고용이에요. 출국 전 각국 세관 공지를 꼭 확인하세요.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
