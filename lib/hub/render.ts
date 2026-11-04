import 'server-only';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { MEDIA_DIR, mediaPath, newMediaId } from './media';
import { mutate, newId } from './store';

// 자막은 브라우저 캔버스에서 PNG로 그려서 보낸다. 그래서 미리보기와 결과물의 글꼴·위치가 같다.
// 서버는 ffmpeg로 그 PNG를 시간에 맞춰 영상 위에 얹기만 한다.
export interface Overlay {
  buf: Buffer;
  x: number;
  y: number;
  start: number;
  end: number;
}

const running = new Set<string>();
export const isRendering = (id: string) => running.has(id);

function run(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const p = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let tail = '';
    p.stderr.on('data', (d: Buffer) => {
      tail = (tail + d.toString()).slice(-1500);
    });
    const timer = setTimeout(() => p.kill('SIGKILL'), 20 * 60_000);
    p.on('error', (e) => {
      clearTimeout(timer);
      reject((e as NodeJS.ErrnoException).code === 'ENOENT' ? new Error('서버에 ffmpeg가 없어요. Dockerfile로 배포했는지 확인해 주세요.') : e);
    });
    p.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`영상을 만들지 못했어요: ${tail.split('\n').filter(Boolean).slice(-2).join(' ').slice(0, 300)}`));
    });
  });
}

export async function renderProject(projectId: string, videoId: string, overlays: Overlay[], styleName: string) {
  const video = mediaPath(videoId);
  if (!video) throw new Error('영상을 찾지 못했어요.');
  running.add(projectId);
  const dir = await mkdtemp(path.join(os.tmpdir(), 'hub-render-'));
  try {
    const args = ['-y', '-hide_banner', '-loglevel', 'error', '-i', video];
    const parts: string[] = [];
    let last = '0:v';
    for (let i = 0; i < overlays.length; i++) {
      const o = overlays[i];
      const png = path.join(dir, `${i}.png`);
      await writeFile(png, o.buf);
      args.push('-i', png);
      const out = i === overlays.length - 1 ? 'subbed' : `v${i}`;
      parts.push(`[${last}][${i + 1}:v]overlay=${Math.round(o.x)}:${Math.round(o.y)}:enable='between(t,${o.start.toFixed(3)},${o.end.toFixed(3)})'[${out}]`);
      last = out;
    }
    const script = path.join(dir, 'filter.txt');
    await writeFile(script, overlays.length ? `${parts.join(';\n')};\n[subbed]scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p[final]` : '[0:v]scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p[final]');
    await mkdir(MEDIA_DIR, { recursive: true });
    const mediaId = newMediaId();
    const output = path.join(MEDIA_DIR, `${mediaId}.mp4`);
    args.push('-filter_complex_script', script, '-map', '[final]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', output);
    await run(args);
    const { size } = await stat(output);
    await mutate((hub) => {
      const p = hub.projects.find((x) => x.id === projectId);
      if (!p) return;
      p.renders.unshift({ id: newId(), mediaId, bytes: size, createdAt: new Date().toISOString(), label: styleName || '이름 없는 스타일' });
      p.job = undefined;
      p.updatedAt = new Date().toISOString();
    });
  } catch (e) {
    await mutate((hub) => {
      const p = hub.projects.find((x) => x.id === projectId);
      if (p) p.job = { status: 'failed', error: e instanceof Error ? e.message : '영상을 만들지 못했어요.', startedAt: new Date().toISOString() };
    });
  } finally {
    running.delete(projectId);
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

/** 음성 인식에 보낼 작은 오디오 파일을 뽑는다 */
export async function extractAudio(videoId: string) {
  const video = mediaPath(videoId);
  if (!video) throw new Error('영상을 찾지 못했어요.');
  const dir = await mkdtemp(path.join(os.tmpdir(), 'hub-audio-'));
  const out = path.join(dir, 'audio.mp3');
  await run(['-y', '-hide_banner', '-loglevel', 'error', '-i', video, '-vn', '-ac', '1', '-ar', '16000', '-b:a', '48k', out]);
  return { path: out, cleanup: () => rm(dir, { recursive: true, force: true }).catch(() => {}) };
}
