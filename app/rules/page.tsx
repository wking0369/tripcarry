import { currentDocLang } from '@/lib/lang';
import { AutoRules, BeforeYouBuy } from '../RulesVisual';

export const metadata = { title: 'Before you buy' };

export default async function RulesPage() {
  const lang = await currentDocLang();
  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1>{lang === 'en' ? 'Before you buy' : '구매 전 꼭 확인하세요'}</h1>
          <p>{lang === 'en' ? 'The key rules in one page. The full legal text is in the Terms.' : '핵심 규칙만 한 장에 모았어요. 전체 내용은 이용약관에 있어요.'}</p>
        </div>
      </div>
      <BeforeYouBuy lang={lang} compact />
      <AutoRules lang={lang} />
    </main>
  );
}
