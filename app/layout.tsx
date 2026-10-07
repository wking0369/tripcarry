import type { Metadata, Viewport } from 'next';
import '@fontsource/ibm-plex-sans-kr/400.css';
import '@fontsource/ibm-plex-sans-kr/500.css';
import '@fontsource/ibm-plex-sans-kr/600.css';
import '@fontsource/ibm-plex-sans-kr/700.css';
import './globals.css';
import './p2p.css';
import type { Lang } from '@/lib/i18n';
import { currentLang } from '@/lib/lang';
import Footer from './Footer';
import Nav from './Nav';
import SiteProvider from './Site';

const META: Record<Lang, { title: string; desc: string }> = {
  ko: {
    title: 'TripCarry — 도쿄 한정품, 도쿄 사는 사람이 가져다줘요',
    desc: '온라인으로 못 사는 도쿄 매장 한정품을, 도쿄에 사는 한국인이 귀국길에 매장 정가로 사 와요. 사전 등록하면 첫 거래 수수료 무료.',
  },
  en: {
    title: 'TripCarry — Tokyo store exclusives, brought to Seoul',
    desc: 'Store-only items you can’t buy online, picked up at retail by people living in Tokyo on their way home to Seoul. Join the waitlist.',
  },
  ja: {
    title: 'TripCarry — 韓国の限定品を、韓国に住む人が届けます',
    desc: 'オンラインでは買えない韓国の店舗限定品を、韓国に住む人が帰るついでに定価で買ってきます。事前登録受付中。',
  },
};

// 링크 미리보기 이미지가 절대 주소로 나가도록 실제 사이트 주소를 쓴다 (Railway가 RAILWAY_PUBLIC_DOMAIN을 넣어 준다)
const SITE_URL = process.env.SITE_URL || (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : 'http://localhost:3000');

export async function generateMetadata(): Promise<Metadata> {
  const { title, desc } = META[await currentLang()];
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: '%s · TripCarry' },
    description: desc,
    openGraph: { title, description: desc, type: 'website', siteName: 'TripCarry' },
    twitter: { card: 'summary_large_image', title, description: desc },
  };
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await currentLang();
  return (
    <html lang={lang}>
      <body>
        <SiteProvider lang={lang}>
          <div className="p2p">
            <Nav />
            {children}
            <Footer />
          </div>
        </SiteProvider>
      </body>
    </html>
  );
}
