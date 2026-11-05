import { ADMIN_COOKIE, redirectTo } from '@/lib/admin';

export async function POST() {
  const res = redirectTo('/studio/login');
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}
