import { type NextRequest } from 'next/server';
import { isAdmin, redirectTo } from '@/lib/admin';
import { clean, setTestEmail } from '@/lib/data';

// /admin 표에서 "테스트" 표시를 켜고 끈다. 표시한 이메일은 통계에서 빠진다 (기록은 지우지 않는다).
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return redirectTo('/admin');
  const form = await req.formData();
  const email = clean(form.get('email'), 200).toLowerCase();
  if (email) await setTestEmail(email, form.get('on') === '1');
  return redirectTo(form.get('mask') === '1' ? '/admin?mask=1' : '/admin');
}
