import 'server-only';
import OpenAI from 'openai';
import {
  TEMPLATES,
  makeHashtags,
  newSlide,
  starterSlides,
  type CaptionGoal,
  type PostFormat,
  type PostLang,
  type RefPost,
  type RefStyle,
  type Slide,
  type TemplateId,
  type Theme,
} from './studio';

// 마케팅 스튜디오의 AI 기능: 참고 게시물 스타일 읽기, 아이디어·사진으로 카드와 캡션 만들기.
// OPENAI_API_KEY가 필요하다. AI_MOCK=1이면 키 없이 가짜 결과로 화면 흐름만 확인할 수 있다.

export const AI = {
  key: process.env.OPENAI_API_KEY || '',
  model: process.env.OPENAI_TEXT_MODEL || 'gpt-5.6-terra',
  mock: process.env.AI_MOCK === '1',
};

export class AiSetupError extends Error {}

let client: OpenAI | null = null;
function openai() {
  if (!AI.key) throw new AiSetupError('Railway 변수에 OPENAI_API_KEY를 넣어야 AI 기능을 쓸 수 있어요.');
  if (!client) client = new OpenAI({ apiKey: AI.key });
  return client;
}

type Content = OpenAI.Chat.Completions.ChatCompletionContentPart[];

async function jsonChat<T>(system: string, content: Content, name: string, schema: object): Promise<T> {
  const r = await openai().chat.completions.create({
    model: AI.model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content },
    ],
    response_format: { type: 'json_schema', json_schema: { name, strict: true, schema: schema as Record<string, unknown> } },
  });
  const out = r.choices[0]?.message?.content;
  if (!out) throw new Error('AI가 빈 응답을 돌려줬어요. 다시 시도해 주세요.');
  return JSON.parse(out) as T;
}

const img = (url: string): OpenAI.Chat.Completions.ChatCompletionContentPart => ({ type: 'image_url', image_url: { url, detail: 'low' } });

const BRAND = `TripCarry는 출시 전인 P2P 여행자 직구 매칭 서비스다.
- 구매자: 국내에 없는 물건·비싼 국제 배송비·국내 정가 거품 문제를, 그 나라에서 오는 여행자에게 부탁해서 해결한다.
- 여행자: 이미 가는 경로에서 남는 캐리어 공간으로 보상금(여행비)을 번다.
- 첫 노선: 유럽(프랑스·이탈리아)→한국(현지 명품, 약국 화장품, 한정판 굿즈), 한국→중국·동남아·중동(K-뷰티, K-POP 한정 굿즈, 건강기능식품).
- 안전장치: 에스크로(받고 확인해야 결제 확정), 매장에서 물품+영수증 사진 인증, 48시간 안에 인증 없으면 자동 전액 환불, 면세 한도 자동 확인, 금지 품목(육류·생과일·의약품·모조품) 자동 차단.
- 지금은 사전 등록(대기자) 단계이고, 사전 등록하면 첫 거래 수수료 무료. 사이트 링크는 인스타그램 프로필 링크에 있다.
지켜야 할 것:
- 사실이 아닌 숫자·후기·실적·제휴·"공식"을 지어내지 않는다. 가격을 비교하면 반드시 "예시"임을 밝힌다.
- 관세를 피하는 방법처럼 들리는 표현을 쓰지 않는다. (면세 한도 안에서, 초과분은 신고·납부)
- 특정 브랜드를 깎아내리지 않는다.`;

// ---------- 참고 게시물 ----------

const REF_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'hook', 'layout', 'tone', 'colors', 'caption', 'theme'],
  properties: {
    summary: { type: 'string', description: '이 게시물 스타일의 핵심을 한국어 2~3문장으로' },
    hook: { type: 'string', description: '첫 장(표지)이 시선을 끄는 방식' },
    layout: { type: 'string', description: '글자 크기·배치·여백·이미지 사용 방식' },
    tone: { type: 'string', description: '말투와 분위기' },
    colors: { type: 'string', description: '주요 색감' },
    caption: { type: 'string', description: '캡션이 보이면 그 구성 방식, 안 보이면 어울릴 캡션 방식' },
    theme: { type: 'string', enum: ['light', 'green', 'dark'], description: 'TripCarry 색 테마 중 가장 가까운 것' },
  },
};

export async function analyzeRef(dataUrl: string, note: string): Promise<RefStyle> {
  if (AI.mock) {
    return {
      summary: '[연습 모드] 큰 질문형 문장 하나로 시작하고, 2~4장에서 숫자를 크게 보여 주는 정보형 카드뉴스예요.',
      hook: '첫 장에 굵은 질문 한 줄',
      layout: '왼쪽 정렬, 큰 글자, 넓은 여백',
      tone: '친근한 반말에 가까운 존댓말',
      colors: '밝은 베이지 바탕에 진한 초록 포인트',
      caption: '첫 줄 질문 → 체크 리스트 → 저장 유도',
      theme: 'light',
    };
  }
  return jsonChat<RefStyle>(
    '너는 인스타그램 콘텐츠 디자이너다. 사용자가 마음에 들어 하는 게시물 캡처를 보고, 다른 브랜드가 따라 할 수 있도록 스타일을 분석한다. 내용(브랜드명·상품)이 아니라 형식과 말투를 뽑아낸다. 모든 답은 한국어로.',
    [{ type: 'text', text: `사용자 메모: ${note || '(없음)'}` }, img(dataUrl)],
    'ref_style',
    REF_SCHEMA,
  );
}

// ---------- 아이디어 → 게시물 ----------

export interface GenerateInput {
  idea: string;
  lang: PostLang;
  format: PostFormat;
  goal: CaptionGoal;
  slideCount: number;
  refs: RefPost[];
  /** 게시물에 올린 사진 (data URL) — 순서대로 0, 1, 2… */
  photos: string[];
  photoIds: string[];
}

export interface GenerateOutput {
  title: string;
  slides: Slide[];
  caption: string;
  hashtags: string;
}

const TEMPLATE_IDS = TEMPLATES.map((t) => t.id);

const GEN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'slides', 'caption', 'hashtags'],
  properties: {
    title: { type: 'string', description: '게시물 관리용 짧은 이름 (한국어)' },
    slides: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['template', 'theme', 'photo', 'fields'],
        properties: {
          template: { type: 'string', enum: TEMPLATE_IDS },
          theme: { type: 'string', enum: ['light', 'green', 'dark'] },
          photo: { type: 'integer', description: "template이 'photo'일 때 쓸 사진 번호(0부터). 아니면 -1" },
          fields: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['key', 'value'],
              properties: { key: { type: 'string' }, value: { type: 'string' } },
            },
          },
        },
      },
    },
    caption: { type: 'string' },
    hashtags: { type: 'string', description: '#으로 시작하는 해시태그를 공백으로 구분, 10~20개' },
  },
};

function catalog(lang: PostLang) {
  return TEMPLATES.map((t) => {
    const fields = t.fields.map((f) => `    - ${f.key} (${f.label}${f.multiline ? ', 줄바꿈 \\n 가능' : ''}) 예: ${JSON.stringify(f[lang])}`).join('\n');
    return `- ${t.id}: ${t.name} — ${t.desc}\n${fields}`;
  }).join('\n');
}

function refText(refs: RefPost[]) {
  const usable = refs.filter((r) => r.style);
  if (!usable.length) return '';
  return (
    '\n\n사용자가 마음에 들어 한 게시물 스타일(내용은 베끼지 말고 형식·말투·구성만 참고):\n' +
    usable
      .map((r, i) => `${i + 1}. ${r.style!.summary} / 표지: ${r.style!.hook} / 배치: ${r.style!.layout} / 말투: ${r.style!.tone} / 색: ${r.style!.colors}(테마 ${r.style!.theme}) / 캡션: ${r.style!.caption}${r.note ? ` / 사용자 메모: ${r.note}` : ''}`)
      .join('\n')
  );
}

function toSlides(raw: { template: string; theme: string; photo: number; fields: { key: string; value: string }[] }[], input: GenerateInput): Slide[] {
  const slides: Slide[] = [];
  for (const s of raw.slice(0, 8)) {
    const id = (TEMPLATE_IDS.includes(s.template as TemplateId) ? s.template : 'hook') as TemplateId;
    const base = newSlide(id, input.lang, (['light', 'green', 'dark'].includes(s.theme) ? s.theme : 'light') as Theme);
    const allowed = new Set(Object.keys(base.fields));
    for (const f of s.fields ?? []) if (allowed.has(f.key)) base.fields[f.key] = String(f.value).slice(0, 300);
    if (id === 'photo') {
      const photoId = input.photoIds[s.photo] ?? input.photoIds[0];
      if (!photoId) continue; // 사진이 없으면 사진 카드는 뺀다
      base.image = photoId;
    }
    slides.push(base);
  }
  return slides.length ? slides : starterSlides(input.goal, input.lang);
}

export async function generatePost(input: GenerateInput): Promise<GenerateOutput> {
  if (AI.mock) {
    const slides = starterSlides(input.goal, input.lang).slice(0, Math.max(1, input.slideCount - (input.photoIds.length ? 1 : 0)));
    slides[0].fields.headline = slides[0].fields.headline !== undefined ? input.idea.slice(0, 40) : slides[0].fields.headline;
    if (input.photoIds.length) {
      const p = newSlide('photo', input.lang, 'dark');
      p.image = input.photoIds[0];
      p.fields.headline = `[연습 모드] 사진 속 물건,\n여행자가 들고 와요`;
      slides.unshift(p);
    }
    return {
      title: `[연습] ${input.idea.slice(0, 24)}`,
      slides,
      caption: `[연습 모드 — 실제 AI 문구가 아니에요]\n${input.idea}\n\n${input.refs.length ? `참고 게시물 ${input.refs.length}개 스타일 반영 예정` : ''}\n👉 프로필 링크`,
      hashtags: makeHashtags(input.goal, input.lang, 'eu'),
    };
  }

  const langName = input.lang === 'ko' ? '한국어' : '영어';
  const system = `너는 TripCarry의 인스타그램 콘텐츠 기획자다. 사용자의 아이디어로 캐러셀 카드뉴스와 캡션을 만든다.

${BRAND}

카드 템플릿 (template id와 fields의 key를 정확히 써야 한다):
${catalog(input.lang)}

규칙:
- 카드 ${input.slideCount}장 안팎. 첫 장은 스크롤을 멈추게 하는 훅, 마지막 장은 행동 유도(이용 방법 또는 사전 등록 이유).
- 카드 글은 ${langName}로, 짧게. 큰 문장은 한 줄 15자(영어 28자) 안팎, 최대 3줄. 줄바꿈은 \\n.
- ${input.format === 'story' ? '스토리(9:16) 한 장짜리라면 핵심 한 장에 집중.' : '피드 캐러셀(4:5).'}
- 사진이 주어졌으면 사진 내용과 직접 연결되는 문구를 쓰고, 사진마다 'photo' 템플릿 카드를 만들어 photo 번호를 지정한다. 사진이 없으면 'photo' 템플릿을 쓰지 않는다.
- compare 템플릿의 금액은 숫자만, note에 예시 금액이라고 밝힌다. 실제 가격을 아는 척하지 않는다.
- 캡션은 ${langName}로: 첫 줄 훅 → 핵심 2~4줄(이모지 적당히) → 사전 등록 유도("프로필 링크"/"link in bio"). URL은 쓰지 않는다. 2,200자 이내.
- 해시태그는 ${langName} 위주 10~20개, #TripCarry 포함.${refText(input.refs)}`;

  const content: Content = [
    { type: 'text', text: `아이디어: ${input.idea}\n목적: ${input.goal}\n사진 ${input.photos.length}장${input.photos.length ? ' (아래 순서대로 0번부터)' : ''}` },
    ...input.photos.map(img),
  ];

  const out = await jsonChat<{ title: string; slides: { template: string; theme: string; photo: number; fields: { key: string; value: string }[] }[]; caption: string; hashtags: string }>(
    system,
    content,
    'instagram_post',
    GEN_SCHEMA,
  );
  return {
    title: out.title.slice(0, 120),
    slides: toSlides(out.slides, input),
    caption: out.caption.slice(0, 2200),
    hashtags: out.hashtags.slice(0, 600),
  };
}
