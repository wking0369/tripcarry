import 'server-only';
import { randomBytes } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DATA_DIR } from '../data';
import { buildSample } from './seed';
import { EMPTY_HUB, type Creator, type Hub } from './types';

// 모든 허브 데이터를 JSON 파일 하나에 저장한다. 사용자가 한 명이라 이 정도로 충분하다.
const FILE = path.join(DATA_DIR, 'hub.json');

export const newId = () => randomBytes(6).toString('hex');

async function load(): Promise<Hub | null> {
  try {
    return { ...EMPTY_HUB, ...(JSON.parse(await readFile(FILE, 'utf8')) as Partial<Hub>) };
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
    // 파일이 깨졌을 때 빈 데이터로 덮어쓰면 기록을 잃으므로 그대로 멈춘다.
    throw new Error('hub.json을 읽지 못했어요. 파일을 확인해 주세요.');
  }
}

async function save(hub: Hub) {
  await mkdir(DATA_DIR, { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(hub), 'utf8');
  await rename(tmp, FILE);
}

let chain: Promise<unknown> = Promise.resolve();
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn, fn);
  chain = next.catch(() => {});
  return next;
}

/** 처음 열면 샘플 데이터를 넣는다. 샘플을 지운 뒤에는 다시 넣지 않는다. */
export function readHub(): Promise<Hub> {
  return serial(async () => {
    const hub = await load();
    if (hub) return hub;
    const seeded = { ...EMPTY_HUB, ...buildSample() };
    await save(seeded);
    return seeded;
  });
}

export function mutate<T>(fn: (hub: Hub) => T): Promise<T> {
  return serial(async () => {
    const hub = (await load()) ?? { ...EMPTY_HUB, ...buildSample() };
    const out = fn(hub);
    await save(hub);
    return out;
  });
}

export function pickCreator(hub: Hub, id?: string): Creator | null {
  return hub.creators.find((c) => c.id === id) ?? hub.creators[0] ?? null;
}
