# 레딧 수요 조사 계획

## 1. 판단 기준 (미리 정해 둔 것)

`/admin` 화면에 같은 기준이 진행률로 보여요.

| 지표 | 목표 | 의미 |
|---|---|---|
| 방문자 | 300명 | 숫자가 이보다 적으면 비율이 크게 흔들려서 판단하기 어려워요 |
| 사전 등록 | 30명 (전환율 5~10%) | 관심의 크기 |
| 여행자 등록 | 10명 | 공급 쪽이 없으면 서비스가 안 돌아가요 |
| 같은 경로 반복 | 한 경로에 5명 이상 | 어디부터 열지 정할 근거 |

세 가지 목표를 모두 넘으면 "수요 있음"으로 보고, 한 가지라도 크게 모자라면 메시지나 대상 게시판을 바꿔서 한 번 더 해 보세요.
기간은 1~2주를 권해요.

## 2. 링크 만들기

게시판마다 `?src=`를 다르게 붙이면 `/admin`에서 따로 집계돼요.

```
https://사이트주소/?src=r_SideProject
https://사이트주소/?src=r_solotravel
https://사이트주소/?src=r_snackexchange
```

`src` 없이 레딧에서 들어오면 `reddit (untagged)`로 잡혀요.

## 3. 게시판 후보

**올리기 전에 게시판 규칙(사이드바/Rules)을 꼭 읽어 주세요.** 규칙은 자주 바뀌고, 광고성 링크를 금지하는 곳이 많아요. 계정 나이·카르마 제한이 있는 곳도 있어요.

| 묶음 | 게시판 예시 | 방식 | 참고 |
|---|---|---|---|
| 피드백 요청이 허용되는 곳 | r/SideProject, r/alphaandbetausers, r/roastmystartup, r/indiehackers, r/startups(주간 피드백 스레드) | 링크 포함 가능 | 방문자가 대부분 창업자라서 **실제 고객 수요로 보긴 어려워요**. 문구·디자인 반응 확인용 |
| 여행자 (공급) | r/solotravel, r/digitalnomad, r/onebag, r/expats, r/TravelHacks | 질문형 글, 링크는 규칙이 허용할 때만 | 대부분 홍보 금지. "이런 부탁 받아 본 적 있나요?"로 경험을 물어요 |
| 구매자 (수요) | r/snackexchange, r/AsianBeauty, r/KoreanBeauty, r/JapanTravel, r/Kpop 굿즈 관련 게시판 | 질문형 글 | 해외 물건을 구하려는 사람이 많은 곳. r/snackexchange는 이미 나라 간 교환 문화가 있어요 |

진짜 수요 판단은 **여행자·구매자 게시판**에서 온 숫자로 하세요. 피드백 게시판 숫자는 따로 보세요.

**하지 말 것**: 여러 계정으로 글 올리기, 추천(업보트) 부탁, 같은 글 여러 곳에 동시에 도배 — 레딧에서 도메인째 차단될 수 있어요.

## 4. 게시글 초안 (영어)

### A. 피드백 게시판용 (r/SideProject 등, 링크 포함)

**Title:** I'm testing an idea: pay travelers to bring you stuff from abroad instead of paying for international shipping

> Hi all — I'm validating an idea before building it for real.
>
> **The problem:** international shipping and customs make it expensive (or impossible) to get things like store-exclusive merch, snacks, or K-beauty from other countries.
>
> **The idea:** someone who's already flying that route buys the item in-store (with a receipt), brings it in their luggage and hands it over. The buyer pays item + a small reward; money is held in escrow until delivery. The site checks each country's duty-free limit and blocks banned items automatically, so travelers don't get into trouble at customs.
>
> Landing page (with a working duty-free calculator): {링크}
>
> I'd love blunt feedback:
> 1. Would you use this as a buyer or a traveler — or would something stop you?
> 2. What's the scariest part (trust, customs, delivery)?
>
> There's a waitlist if you're interested, but honest criticism is just as useful.

### B. 여행자 게시판용 (질문형, 링크 없음)

**Title:** Have you ever been asked to bring something back from a trip? Would you do it for a fee?

> I'm researching this for a project. Friends and family always ask me to bring back things they can't get at home (snacks, cosmetics, limited merch).
>
> If a stranger paid you a reward (say $15–40) to buy something in a store at your destination and bring it back — with the money held by a platform until you hand it over — would you do it?
>
> What would make you say no? Customs limits, luggage space, trust, something else?

규칙상 링크가 허용되면 댓글에서 누가 물어볼 때만 `?src=r_게시판` 링크를 달아 주세요.

### C. 구매자 게시판용 (질문형)

**Title:** What's something from another country you really want but can't get shipped?

> For me it's a few Japanese snacks and a Korean skincare product that no one ships here, or the shipping costs more than the item.
>
> Curious what everyone else is stuck on — and would you pay a traveler a small fee to bring it in their luggage?

댓글에 나온 물건·나라 목록 자체가 좋은 수요 데이터예요. 스프레드시트에 따로 적어 두세요.

## 5. 결과 보는 법

- `/admin`에서 게시판별 방문자·등록·전환율과 많이 원하는 경로를 봐요.
- CSV를 받으면 등록자 이메일로 출시 소식을 보낼 수 있어요. (등록할 때 출시 소식만 보낸다고 약속했어요.)
- 전환율이 낮고 버튼 클릭률도 낮으면 → 첫 화면 문구 문제일 가능성이 커요.
- 버튼 클릭은 많은데 등록이 적으면 → 팝업 단계(입력 칸 수, 신뢰) 문제일 가능성이 커요.
