import { NextResponse, type NextRequest } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { isRendering, renderProject, type Overlay } from '@/lib/hub/render';
import { mutate, readHub } from '@/lib/hub/store';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 });
  const { id } = await params;
  const hub = await readHub();
  const project = hub.projects.find((p) => p.id === id);
  if (!project) return NextResponse.json({ error: '프로젝트를 찾지 못했어요.' }, { status: 404 });
  if (isRendering(id)) return NextResponse.json({ error: '이미 영상을 만들고 있어요.' }, { status: 409 });

  const form = await req.formData();
  let manifest: { x: number; y: number; start: number; end: number }[];
  try {
    manifest = JSON.parse(String(form.get('manifest')));
    if (!Array.isArray(manifest) || manifest.length > 400) throw new Error();
  } catch {
    return NextResponse.json({ error: '자막 정보가 올바르지 않아요.' }, { status: 400 });
  }
  const overlays: Overlay[] = [];
  for (let i = 0; i < manifest.length; i++) {
    const m = manifest[i];
    const file = form.get(`cue${i}`);
    if (!(file instanceof Blob) || file.size > 8 * 1024 * 1024) return NextResponse.json({ error: `${i + 1}번 자막 이미지가 없어요.` }, { status: 400 });
    const buf = Buffer.from(await file.arrayBuffer());
    const nums = [m.x, m.y, m.start, m.end];
    if (!buf.subarray(0, 4).equals(PNG) || nums.some((n) => !Number.isFinite(n)) || m.end <= m.start) return NextResponse.json({ error: `${i + 1}번 자막을 확인해 주세요.` }, { status: 400 });
    overlays.push({ buf, x: m.x, y: m.y, start: m.start, end: m.end });
  }

  await mutate((h) => {
    const p = h.projects.find((x) => x.id === id);
    if (p) p.job = { status: 'running', startedAt: new Date().toISOString() };
  });
  // 오래 걸리므로 응답을 먼저 돌려주고, 화면은 GET으로 상태를 확인한다.
  void renderProject(id, project.videoId, overlays, String(form.get('label') ?? ''));
  return NextResponse.json({ ok: true }, { status: 202 });
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 });
  const { id } = await params;
  const hub = await readHub();
  const p = hub.projects.find((x) => x.id === id);
  if (!p) return NextResponse.json({ error: '프로젝트를 찾지 못했어요.' }, { status: 404 });
  // 서버가 재시작되면 작업이 사라지므로 실패로 알려 준다.
  const job = p.job?.status === 'running' && !isRendering(id) ? { status: 'failed', error: '작업이 중단됐어요. 다시 만들어 주세요.' } : p.job ?? null;
  return NextResponse.json({ job, renders: p.renders });
}
