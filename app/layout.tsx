import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import '@fontsource/ibm-plex-sans-kr/400.css';
import '@fontsource/ibm-plex-sans-kr/500.css';
import '@fontsource/ibm-plex-sans-kr/600.css';
import '@fontsource/ibm-plex-sans-kr/700.css';
import './globals.css';
import './p2p.css';
import { LANG_COOKIE, toLang } from '@/lib/i18n';
import Footer from './Footer';
import Nav from './Nav';
import SiteProvider from './Site';

const TITLE = 'TripCarry — have a traveler bring it';
const DESC = 'Skip pricey international shipping: travelers already flying your way buy the item in-store and bring it. Travelers turn spare luggage space into travel money. Join the waitlist.';

export const metadata: Metadata = {
  title: { default: TITLE, template: '%s · TripCarry' },
  description: DESC,
  openGraph: { title: TITLE, description: DESC, type: 'website', siteName: 'TripCarry' },
  twitter: { card: 'summary', title: TITLE, description: DESC },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = toLang((await cookies()).get(LANG_COOKIE)?.value);
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
