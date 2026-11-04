import 'server-only';
import { cookies } from 'next/headers';

export async function currentCreatorId() {
  return (await cookies()).get('hub_creator')?.value;
}
