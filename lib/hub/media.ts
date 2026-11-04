import 'server-only';
import { randomBytes } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, open, stat, unlink, type FileHandle } from 'node:fs/promises';
import path from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream as WebStream } from 'node:stream/web';
import { DATA_DIR } from '../data';

// 영상 파일은 데이터 폴더의 media 아래에 둔다.
export const MEDIA_DIR = path.join(DATA_DIR, 'media');
export const MAX_VIDEO_BYTES = 500 * 1024 * 1024;
const ID = /^[a-f0-9]{16}$/;

export const mediaPath = (id: string) => (ID.test(id) ? path.join(MEDIA_DIR, `${id}.mp4`) : null);
export const newMediaId = () => randomBytes(8).toString('hex');

/** 업로드를 디스크로 바로 흘려보낸다. MP4·MOV가 아니거나 너무 크면 지운다. */
export async function saveVideo(body: ReadableStream<Uint8Array>) {
  await mkdir(MEDIA_DIR, { recursive: true });
  const id = newMediaId();
  const file = path.join(MEDIA_DIR, `${id}.mp4`);
  let bytes = 0;
  const limit = new Transform({
    transform(chunk: Buffer, _e, cb) {
      bytes += chunk.length;
      if (bytes > MAX_VIDEO_BYTES) cb(new Error('too_large'));
      else cb(null, chunk);
    },
  });
  try {
    await pipeline(Readable.fromWeb(body as unknown as WebStream), limit, createWriteStream(file));
    const fh = await open(file, 'r');
    const head = Buffer.alloc(12);
    await fh.read(head, 0, 12, 0);
    await fh.close();
    if (head.subarray(4, 8).toString() !== 'ftyp') throw new Error('bad_type');
    return { id, bytes };
  } catch (e) {
    await unlink(file).catch(() => {});
    throw e;
  }
}

export async function mediaStat(id: string) {
  const p = mediaPath(id);
  if (!p) return null;
  try {
    return { path: p, size: (await stat(p)).size };
  } catch {
    return null;
  }
}

/** 파일 일부를 스트림으로 보낸다. 브라우저가 중간에 끊어도(영상 탐색) 서버에 오류가 남지 않게 직접 읽는다. */
export function mediaStream(p: string, start: number, end: number): ReadableStream<Uint8Array> {
  let fh: FileHandle | null = null;
  let pos = start;
  let closed = false;
  const finish = async () => {
    closed = true;
    const h = fh;
    fh = null;
    await h?.close().catch(() => {});
  };
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (closed) return;
      try {
        fh ??= await open(p, 'r');
        const len = Math.min(256 * 1024, end - pos + 1);
        const buf = Buffer.alloc(Math.max(0, len));
        const { bytesRead } = len > 0 ? await fh.read(buf, 0, len, pos) : { bytesRead: 0 };
        if (closed) {
          await finish();
          return;
        }
        if (!bytesRead) {
          await finish();
          controller.close();
          return;
        }
        pos += bytesRead;
        controller.enqueue(new Uint8Array(buf.subarray(0, bytesRead)));
      } catch (e) {
        const cancelled = closed;
        await finish();
        if (!cancelled) controller.error(e);
      }
    },
    cancel: finish,
  });
}

export async function deleteMedia(id: string) {
  const p = mediaPath(id);
  if (p) await unlink(p).catch(() => {});
}
