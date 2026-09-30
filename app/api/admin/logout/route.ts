import { ADMIN_COOKIE, redirectTo } from '@/lib/admin';

export async function POST() {
  const res = redirectTo('/admin');
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}
