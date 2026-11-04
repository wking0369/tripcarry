import 'server-only';
import { createReadStream } from 'node:fs';
import OpenAI from 'openai';
import { extractAudio } from './render';
import { parseSrt } from './srt';
import type { Creator, Cue, Post, ReportNarrative, ReportNumbers } from './types';

// OPENAI_API_KEY가 필요하다. AI_MOCK=1이면 키 없이 연습용 결과로 흐름만 확인한다.
export const AI = {
  key: process.env.OPENAI_API_KEY || '',
  model: process.env.OPENAI_TEXT_MODEL || 'gpt-5.6-terra',
  mock: process.env.AI_MOCK === '1',
};
export const aiReady = () => AI.mock || Boolean(AI.key);

export class AiSetupError extends Error {}

let client: OpenAI | null = null;
function openai() {
  if (!AI.key) throw new AiSetupError('Railway 변수에 OPENAI_API_KEY를 넣어야 AI 기능을 쓸 수 있어요.');
  if (!client) client = new OpenAI({ apiKey: AI.key });
  return client;
}

async function jsonChat<T>(system: string, user: string, name: string, schema: object): Promise<T> {
  const r = await openai().chat.completions.create({
    model: AI.model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    response_format: { type: 'json_schema', json_schema: { name, strict: true, schema: schema as Record<string, unknown> } },
  });
  const out = r.choices[0]?.message?.content;
  if (!out) throw new Error('AI가 빈 응답을 돌려줬어요. 다시 시도해 주세요.');
  return JSON.parse(out) as T;
}

// ---------- 자막 초안 ----------

const CUES_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['lines'],
  properties: { lines: { type: 'array', items: { type: 'string' } } },
};

/** 영상의 음성을 받아 적고 한국어 자막 초안을 만든다. 시간은 음성 인식 결과를 그대로 쓴다. */
export async function draftCues(videoId: string, creator: Creator): Promise<Cue[]> {
  if (AI.mock) {
    return [
      { start: 0.3, end: 2.6, text: '[연습 모드] 지금 하는 일,\n10년 뒤에도 하고 싶으세요?' },
      { start: 2.8, end: 5.2, text: '[연습 모드] 실제 번역이 아니에요.' },
    ];
  }
  const audio = await extractAudio(videoId);
  try {
    const srt = (await openai().audio.transcriptions.create({ file: createReadStream(audio.path), model: 'whisper-1', response_format: 'srt' })) as unknown as string;
    const cues = parseSrt(srt);
    if (!cues.length) throw new Error('영상에서 말소리를 찾지 못했어요.');
    const out = await jsonChat<{ lines: string[] }>(
      `너는 인스타그램 릴스 한국어 자막 번역가다. 원문의 뜻을 빼거나 더하지 말고, 화자의 말투를 유지해 자연스러운 한국어로 옮긴다.
화자 말투 메모: ${creator.voice || '(없음)'}
규칙: 입력 줄 수와 출력 줄 수가 정확히 같아야 한다. 한 줄에 한 자막. 없는 사실을 만들지 않는다.`,
      JSON.stringify(cues.map((c) => c.text)),
      'subtitle_lines',
      CUES_SCHEMA,
    );
    if (out.lines.length !== cues.length) throw new Error('번역 줄 수가 원문과 달라요. 다시 시도해 주세요.');
    return cues.map((c, i) => ({ ...c, text: out.lines[i] }));
  } finally {
    await audio.cleanup();
  }
}

// ---------- 변형본 제안 ----------

const VARIANT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['hooks', 'caption'],
  properties: { hooks: { type: 'array', items: { type: 'string' } }, caption: { type: 'string' } },
};

export async function suggestVariant(post: Post, creator: Creator, winners: string[]): Promise<{ hooks: string[]; caption: string }> {
  if (AI.mock) {
    return {
      hooks: [`[연습] ${post.hook} (질문으로 바꾼 안)`, `[연습] ${post.hook} (숫자를 앞세운 안)`, `[연습] ${post.hook} (결론부터 말하는 안)`],
      caption: `[연습 캡션] ${post.caption}`,
    };
  }
  return jsonChat(
    `너는 인스타그램 릴스 편집자다. 잘 된 릴스를 트라이얼로 다시 시험하기 위해 첫 문장을 새로 쓴다.
규칙: 영상 내용과 사실을 바꾸지 않는다. 없는 숫자나 실적을 만들지 않는다. 각 안은 원문 첫 문장과 분명히 달라야 하고 서로 다른 접근이어야 한다. 한국어로 쓴다.
화자 말투 메모: ${creator.voice || '(없음)'}`,
    `원본 첫 문장: ${post.hook}\n주제: ${post.topic}\n원본 캡션: ${post.caption}\n이 계정에서 잘 된 첫 문장들: ${winners.join(' / ') || '(없음)'}\n첫 문장 3개와 새 캡션 1개를 만들어 줘.`,
    'variant',
    VARIANT_SCHEMA,
  );
}

// ---------- 보고서 해석 ----------

const REPORT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'worked', 'didnt', 'style', 'next'],
  properties: {
    summary: { type: 'string' },
    worked: { type: 'array', items: { type: 'string' } },
    didnt: { type: 'array', items: { type: 'string' } },
    style: { type: 'array', items: { type: 'string' } },
    next: { type: 'array', items: { type: 'string' } },
  },
};

export async function writeNarrative(numbers: ReportNumbers, creator: Creator, period: string): Promise<ReportNarrative> {
  return jsonChat<ReportNarrative>(
    `너는 인스타그램 계정 운영 분석가다. 주어진 숫자만 근거로 2주 운영 보고서를 한국어로 쓴다. 친근하고 직설적인 반말로 쓴다.
규칙:
- 주어진 JSON에 없는 숫자, 원인, 외부 트렌드를 지어내지 않는다.
- 게시물이 3개 미만인 묶음은 "표본이 적다"고 밝히고 단정하지 않는다. 상관관계를 인과로 단정하지 않는다.
- summary: 이번 2주 결론을 2~3문장. worked: 잘 된 것. didnt: 안 된 것. style: 다음에 가져갈 스타일. next: 다음 2주에 할 구체적 실험 3개 이내.`,
    `계정: ${creator.name}\n기간: ${period}\n숫자:\n${JSON.stringify(numbers)}`,
    'report',
    REPORT_SCHEMA,
  );
}
