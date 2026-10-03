import { currentDocLang } from '@/lib/lang';
import Calculator from '../Calculator';

export const metadata = { title: 'Duty-free calculator' };

export default async function DutyFreePage() {
  const lang = await currentDocLang();
  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1>{lang === 'en' ? 'Duty-free limit check' : '면세 한도 확인'}</h1>
          <p>{lang === 'en' ? 'Where are you flying into, and what’s in the bag?' : '어느 나라로 들어가고, 가방에 뭘 넣을지 넣어 보세요.'}</p>
        </div>
      </div>
      <Calculator key={lang} lang={lang} />
    </main>
  );
}
