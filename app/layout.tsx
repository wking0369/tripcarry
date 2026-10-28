import type { Metadata, Viewport } from 'next';

// 링크 미리보기가 절대 주소로 나가도록 실제 사이트 주소를 쓴다 (Railway가 RAILWAY_PUBLIC_DOMAIN을 넣어 준다)
const SITE_URL = process.env.SITE_URL || (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : 'http://localhost:3000');

const TITLE = '韩国 Instagram 本地化 · 让韩国粉丝发现你';
const DESC = '把你在小红书已经验证过的内容，变成韩国人习惯的 Instagram 内容。韩语母语者把关，每篇附中文回译。试运营仅限前 2 位。';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: '%s · 韩国 Instagram 本地化' },
  description: DESC,
  openGraph: { title: TITLE, description: DESC, type: 'website' },
  twitter: { card: 'summary', title: TITLE, description: DESC },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
