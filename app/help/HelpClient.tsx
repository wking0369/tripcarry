'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { RULES } from '@/lib/rules';
import { useSite } from '../Site';

type QA = { q: string; a: string[]; link?: { href: string; label: string } };

const R = RULES;

const FAQ: Record<'ko' | 'en', QA[]> = {
  ko: [
    { q: '배송이 늦어져요', a: ['먼저 거래 화면의 1:1 채팅으로 여행자에게 도착 일정을 물어보세요.', `결제 후 ${R.receiptDueHours}시간 안에 구매 인증 사진이 안 올라오면 시스템이 자동으로 취소하고 전액 환불해요. 따로 신청할 필요 없어요.`], link: { href: '/orders', label: '거래 현황 열기' } },
    { q: '세관에 걸렸어요', a: ['면세 한도를 넘는 물품은 여행자가 입국할 때 자진 신고하고, 세금은 결제 때 미리 낸 예상 세액으로 처리해요.', '실제 세금과 차액이 생기면 세관 영수증을 채팅에 올려 정산해요. 허위 신고로 생긴 불이익은 여행자 책임이에요(약관 제5조).'], link: { href: '/terms', label: '약관 제4·5조 보기' } },
    { q: '취소하고 싶어요', a: ['여행자가 구매 인증을 올리기 전이면 거래 화면에서 바로 취소할 수 있고, 보관 중인 금액은 자동으로 전액 환불돼요.', '구매 인증 이후에는 이미 물건을 샀기 때문에 상대방과 채팅으로 합의해야 해요.'] },
    { q: '환불은 언제 되나요?', a: ['자동 환불은 취소되는 즉시 결제한 수단으로 돌아가요. (카드사 처리에 3~5영업일 걸릴 수 있어요)', `매칭이 안 된 요청은 결제 전이라 청구 자체가 없어요. 희망일 ${R.matchCutoffHours}시간 전까지 매칭이 안 되면 자동으로 닫혀요.`] },
    { q: '물건이 파손됐거나 다른 물건이에요', a: ['구매 인증(물품+영수증)·포장 인증 사진과 받은 물건을 비교할 수 있어요.', '수령 확인 전이라면 채팅에 사진을 남기고 상대방과 해결해 주세요. 분쟁은 시스템에 남은 사진 기록대로 처리돼요.'] },
    { q: '여행자가 연락이 안 돼요', a: [`구매 인증 기한(${R.receiptDueHours}시간)이 지나면 자동 취소·전액 환불되고, 여행자는 보증금 몰수와 ${R.noShowSuspendDays}일 정지를 받아요.`, '기한 전이라도 채팅 기록이 남아 있으니 기다리는 동안 다른 여행자를 찾을 수 있어요.'] },
    { q: '관세는 누가 내나요?', a: ['원칙적으로 구매자가 내요. 면세 한도를 넘으면 요청을 올릴 때 예상 세금에 동의해야 다음 단계로 넘어가요.'], link: { href: '/duty-free', label: '면세 한도 계산기' } },
    { q: '어떤 물건은 안 되나요?', a: ['육류·육가공품(육포, 소시지), 생과일·씨앗, 처방 의약품, 모조품, 무기·마약류, 주류·담배는 요청 단계에서 자동 차단돼요.', '술과 담배는 여행자 면세가 본인 사용분에만 해당되고, 돈을 받고 넘기면 면허가 필요한 판매가 될 수 있어서 다루지 않아요.', '건강기능식품·보조배터리는 수량 제한이 있어요.'] },
    { q: '전달 장소·시간을 바꾸고 싶어요', a: ['운영자를 거치지 않고 거래 화면의 1:1 채팅에서 상대방과 바로 정하면 돼요.'] },
    { q: '여행자는 언제 돈을 받나요?', a: ['현장에서 구매자의 수령 코드를 입력하면 그 즉시 정산돼요.', `전달 사진만 올린 경우에는 구매자가 확인하거나, ${R.confirmDueHours}시간이 지나면 자동으로 정산돼요.`] },
  ],
  en: [
    { q: 'My delivery is late', a: ['First ask the traveler in the 1:1 chat on your order.', `If there’s no purchase proof within ${R.receiptDueHours}h of payment, the system cancels and refunds you in full automatically — nothing to file.`], link: { href: '/orders', label: 'Open orders' } },
    { q: 'It got stopped at customs', a: ['Items over the duty-free limit are declared by the traveler on arrival; the duty is covered by the estimate you prepaid.', 'Any difference is settled with the customs receipt in chat. Penalties from false declarations are the traveler’s responsibility (Terms §5).'], link: { href: '/terms', label: 'Terms §4–5' } },
    { q: 'I want to cancel', a: ['Before the traveler uploads purchase proof, cancel right on the order and the held amount is refunded automatically.', 'After purchase proof the item is already bought, so agree with the other person in chat.'] },
    { q: 'When do I get my refund?', a: ['Automatic refunds go back to your payment method as soon as the order is cancelled (banks may take 3–5 business days).', `Unmatched requests are never charged. They close automatically ${R.matchCutoffHours}h before your date.`] },
    { q: 'It’s damaged or the wrong item', a: ['Compare with the purchase (item + receipt) and packing photos.', 'Before confirming, post photos in chat and settle it with the traveler. Disputes follow the photo record.'] },
    { q: 'The traveler isn’t responding', a: [`After the ${R.receiptDueHours}h purchase-proof deadline you’re refunded automatically, and the traveler loses their deposit and is suspended for ${R.noShowSuspendDays} days.`] },
    { q: 'Who pays customs duty?', a: ['The buyer, as a rule. If you’re over the limit you must accept the estimated tax before you can continue.'], link: { href: '/duty-free', label: 'Duty-free calculator' } },
    { q: 'What can’t I request?', a: ['Meat products (jerky, sausage), fresh fruit and seeds, prescription drugs, counterfeits, weapons, drugs, alcohol and tobacco are blocked automatically.', 'We don’t handle alcohol or tobacco: allowances cover only your own use, and passing them on for money can count as licensed sales.', 'Supplements and power banks have quantity limits.'] },
    { q: 'I want to change the place or time', a: ['Agree on it directly with the other person in the order’s 1:1 chat — no need to contact us.'] },
    { q: 'When does the traveler get paid?', a: ['Instantly, when they enter the buyer’s hand-off code in person.', `With a hand-off photo only, when the buyer confirms — or automatically after ${R.confirmDueHours}h.`] },
  ],
};

export default function HelpClient() {
  const { dl: lang } = useSite();
  const list = FAQ[lang];
  const [thread, setThread] = useState<number[]>([]);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (thread.length) end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [thread]);

  const ko = lang === 'ko';
  return (
    <main className="page" style={{ maxWidth: 820 }}>
      <div className="page-head">
        <div>
          <h1>{ko ? '무엇을 도와드릴까요?' : 'How can we help?'}</h1>
          <p>{ko ? '질문을 누르면 바로 답해 드려요. 거래 관련 대화는 상대방과 1:1 채팅으로 직접 하면 돼요.' : 'Tap a question for an instant answer. Anything about a specific order, sort out directly in the 1:1 chat.'}</p>
        </div>
      </div>

      <div className="help-grid" role="list">
        {list.map((x, i) => (
          <button key={x.q} type="button" role="listitem" className="help-q" aria-pressed={thread.includes(i)} onClick={() => setThread((t) => [...t.filter((n) => n !== i), i])}>
            {x.q}
          </button>
        ))}
      </div>

      {thread.length > 0 && (
        <section className="card help-chat" aria-live="polite">
          {thread.map((i) => (
            <div key={i} className="help-turn">
              <div className="bubble me">{list[i].q}</div>
              <div className="bubble bot">
                {list[i].a.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                {list[i].link && (
                  <Link className="btn btn-sm" href={list[i].link!.href}>{list[i].link!.label} →</Link>
                )}
              </div>
            </div>
          ))}
          <div ref={end} />
          <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setThread([])}>
            {ko ? '대화 지우기' : 'Clear'}
          </button>
        </section>
      )}
    </main>
  );
}
