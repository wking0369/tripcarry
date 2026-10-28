# 韩国 Instagram 本地化 — 랜딩 페이지

중국 크리에이터에게 보내는 한국 인스타그램 현지화 서비스 소개 페이지예요.
(이 저장소는 원래 TripCarry였고, 2026년 10월에 이 사이트로 바꿨어요.)

## 화면

| 주소 | 내용 |
|---|---|
| `/` | 서비스 소개 · 1개월 파일럿(₩400,000, 선착순 2명) · 신청 설문 링크 · 위챗 ID |
| `/#ko` | 같은 페이지를 한국어로 (오른쪽 위 버튼으로도 바꿀 수 있어요) |
| `/admin` | (비밀번호) 예전 TripCarry 사전등록 결과 — CSV로 내보내기 가능 |
| `/studio` | (비밀번호) AI 콘텐츠 스튜디오 — 나중에 현지화 스튜디오로 바꿀 자리 |

## 문구 고치기

- 모든 문구: `lib/landing-copy.ts` (중국어 `zh`, 한국어 `ko`)
- 신청 설문 링크·위챗 ID: 같은 파일 위쪽의 `SURVEY_URL`, `WECHAT_ID`
- 화면 구조: `app/Landing.tsx`, 스타일: `app/landing.css`

## 실행

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Railway

이미 연결된 서비스를 그대로 써요. 변수는 그대로 두면 돼요.

- `ADMIN_PASSWORD` — `/admin`, `/studio` 비밀번호
- `DATA_DIR` = `/data` (Volume) — 예전 사전등록 기록과 스튜디오 데이터
- `OPENAI_API_KEY`, `OPENAI_TEXT_MODEL` — `/studio`의 AI 기능
- 주소에 `tripcarry`가 들어가 있으면 **Settings → Networking**에서 새 도메인을 만들어 바꿔요.
