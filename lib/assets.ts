import 'server-only';
import { randomBytes } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DATA_DIR } from './data';
import { ASSET_ID, type RefPost, type RefStyle } from './studio';

// 스튜디오에 올린 사진·참고 게시물 캡처. 브라우저에서 줄여서 JPEG로 올린다.
const DIR = path.join(DATA_DIR, 'assets');
const REFS = path.join(DATA_DIR, 'refs.json');
export const MAX_ASSET_BYTES = 4 * 1024 * 1024;

const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

function sniff(buf: Buffer): string | null {
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'image/jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  return null;
}

export async function saveAsset(buf: Buffer) {
  const type = sniff(buf);
  if (!type) throw new Error('JPG·PNG·WEBP 이미지만 올릴 수 있어요.');
  if (buf.length > MAX_ASSET_BYTES) throw new Error('이미지가 너무 커요 (4MB 이하).');
  await mkdir(DIR, { recursive: true });
  const id = randomBytes(8).toString('hex');
  await writeFile(path.join(DIR, `${id}.${TYPES[type]}`), buf);
  return id;
}

export async function readAsset(id: string): Promise<{ buf: Buffer; type: string } | null> {
  if (!ASSET_ID.test(id)) return null;
  for (const [type, ext] of Object.entries(TYPES)) {
    try {
      return { buf: await readFile(path.join(DIR, `${id}.${ext}`)), type };
    } catch {
      /* 다음 확장자 */
    }
  }
  return null;
}

export async function assetDataUrl(id: string) {
  const a = await readAsset(id);
  return a ? `data:${a.type};base64,${a.buf.toString('base64')}` : null;
}

export async function deleteAsset(id: string) {
  if (!ASSET_ID.test(id)) return;
  for (const ext of Object.values(TYPES)) await unlink(path.join(DIR, `${id}.${ext}`)).catch(() => {});
}

// ---------- 참고 게시물 ----------

export async function readRefs(): Promise<RefPost[]> {
  try {
    const list = JSON.parse(await readFile(REFS, 'utf8')) as RefPost[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

let chain: Promise<unknown> = Promise.resolve();
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn, fn);
  chain = next.catch(() => {});
  return next;
}

async function writeRefs(list: RefPost[]) {
  await mkdir(DATA_DIR, { recursive: true });
  const tmp = `${REFS}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(list, null, 1), 'utf8');
  await rename(tmp, REFS);
}

export function addRef(assetId: string, note: string, style: RefStyle | null) {
  return serial(async () => {
    const ref: RefPost = { id: randomBytes(6).toString('hex'), assetId, note: note.slice(0, 300), style, createdAt: new Date().toISOString() };
    await writeRefs([ref, ...(await readRefs())].slice(0, 60));
    return ref;
  });
}

export function removeRef(id: string) {
  return serial(async () => {
    const list = await readRefs();
    const ref = list.find((r) => r.id === id);
    if (!ref) return false;
    await writeRefs(list.filter((r) => r.id !== id));
    await deleteAsset(ref.assetId);
    return true;
  });
}
