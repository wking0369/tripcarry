import type { Metadata } from 'next';
import '@fontsource/ibm-plex-sans-kr/400.css';
import '@fontsource/ibm-plex-sans-kr/500.css';
import '@fontsource/ibm-plex-sans-kr/600.css';
import '@fontsource/ibm-plex-sans-kr/700.css';
import '../globals.css';
import '../p2p.css';

// 관리자·스튜디오처럼 비밀번호로 들어가는 내부 화면. 검색에 노출하지 않는다.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  return <div className="p2p">{children}</div>;
}
