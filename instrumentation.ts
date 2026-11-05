// 서버가 켜져 있는 동안 5분마다 예약 게시와 2주 보고서를 확인한다.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { tick } = await import('./lib/hub/scheduler');
  const run = () => tick().catch((e) => console.error('hub tick failed', e));
  setTimeout(run, 10_000);
  setInterval(run, 5 * 60_000);
}
