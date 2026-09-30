# TripCarry — 여행자 직구 매칭 (P2P 크라우드 쇼핑) 데모

구매자는 해외 직구 배송비·관세 부담을 줄이고, 여행자는 캐리어 빈 공간으로 여행비를 버는 P2P 플랫폼 아이디어를 검증하는 데모예요.
로그인 없이 누구나 볼 수 있고, 데이터는 방문자 브라우저(localStorage)에만 저장돼요.

## 화면

| 주소 | 내용 |
|---|---|
| `/` | 서비스 소개 · 거래 흐름 · 안전장치 · 면세 계산기 · 수수료 |
| `/requests` | 구매 요청 등록 — 등록할 때 면세 가드가 금지 품목·한도 검사 |
| `/trips` | 여행 일정 등록 → 경로·날짜가 맞는 요청 추천 → 수락 |
| `/orders` | 에스크로 흐름: 결제 → 보관 → 구매(영수증) → 전달(사진) → 수령 확인 → 정산 |
| `/customs` | 7개국 면세 한도와 품목별 반입 규칙 |

## 면세 자동 가드

- 반입 금지 품목(육가공품·생과일·모조품·무기·마약류)은 종류 선택이나 물품 이름만으로 등록을 막아요.
- 면세 한도는 **여행자 한 명의 이번 여행 전체**로 합산해요. 초과하면 예상 세금을 미리 결제하는 조건으로만 수락할 수 있어요.
- 규정표와 판정 로직: `lib/customs.ts` · 수수료: `lib/fees.ts` · 데이터 저장: `lib/store.ts`
- 면세 한도·세율·환율은 참고용 고정값이에요. 대리 구매 물품은 나라에 따라 개인 휴대품으로 인정되지 않을 수 있어서, 정식 서비스 전에는 관세사·변호사 검토가 필요해요.

## 실행

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## 수요 조사 (레딧)

- 랜딩(`/`)은 영어가 기본이고 오른쪽 위 버튼으로 한국어로 바꿀 수 있어요.
- 모든 버튼은 **사전 등록 팝업**을 열어요. 이메일은 필수, 역할·경로·물건·보상금은 선택이에요.
- 방문·버튼 클릭·등록을 서버에 기록해요. 링크에 `?src=이름`을 붙이면 유입 경로별로 따로 세요.
  예: `https://사이트주소/?src=r_solotravel`
- 결과는 `/admin`(비밀번호 필요)에서 보고, CSV로 받을 수 있어요.
- 기록은 `DATA_DIR` 폴더의 `events.jsonl`, `signups.jsonl`에 쌓여요.
- 게시판 후보와 게시글 초안: [`docs/reddit-plan.md`](docs/reddit-plan.md)

## Railway 배포

1. Railway → **New Project → Deploy from GitHub repo** → 이 저장소 선택
2. 서비스 **Variables**에 추가
   - `ADMIN_PASSWORD` — 결과 화면(`/admin`) 비밀번호
   - `DATA_DIR` = `/data`
3. 서비스를 우클릭(또는 ⌘K) → **Attach Volume** → Mount path `/data`
   (Volume이 없으면 재배포할 때마다 모은 이메일이 사라져요)
4. **Settings → Networking → Generate Domain**으로 주소를 만들어요.
