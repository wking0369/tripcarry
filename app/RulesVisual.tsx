import Link from 'next/link';
import type { DocLang as Lang } from '@/lib/i18n';
import { RULES } from '@/lib/rules';

// 운영자 개입 없이 돌아가는 규칙을 그림으로 보여 주는 조각들.
// 랜딩, /rules(구매 전 확인), 미리보기 결제 단계에서 함께 쓴다. (훅이 없어 서버·클라이언트 어디서나 쓸 수 있다)

const I = {
  clock: <path d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />,
  refund: <path d="M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4M12 8v8M9.5 10.5c0-1 1.1-1.8 2.5-1.8s2.5.8 2.5 1.8-1.1 1.6-2.5 1.6-2.5.7-2.5 1.7 1.1 1.8 2.5 1.8 2.5-.8 2.5-1.8" />,
  check: <path d="M20 6 9 17l-5-5" />,
  camera: <path d="M4 8h3l2-3h6l2 3h3v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />,
  box: <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9zM3 7.5 12 12l9-4.5M12 12v9" />,
  qr: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2zM6.5 6.5h1v1h-1zM16.5 6.5h1v1h-1zM6.5 16.5h1v1h-1z" />,
  coin: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9 9h4.5a2 2 0 0 1 0 4H9m0-4v8m0-4h5" />,
  ban: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM5.6 5.6l12.8 12.8" />,
  shield: <path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6l-8-3z" />,
  star: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3z" />,
  chat: <path d="M4 5h16v11H9l-5 4V5zM8 10h8M8 13h5" />,
  stop: <path d="M8 3h8l5 5v8l-5 5H8l-5-5V8l5-5zM9 9l6 6M15 9l-6 6" />,
};

export function Icon({ name, tone = 'accent' }: { name: keyof typeof I; tone?: 'accent' | 'warn' | 'danger' | 'ink' }) {
  return (
    <span className={`rv-icon rv-${tone}`} aria-hidden="true">
      <svg viewBox="0 0 24 24">{I[name]}</svg>
    </span>
  );
}

const TX = {
  ko: {
    autoTitle: '운영자 없이, 규칙대로 자동 처리돼요',
    timeline: [
      { icon: 'clock' as const, tone: 'ink' as const, when: `희망일 ${RULES.matchCutoffHours}시간 전`, what: '매칭이 안 되면', result: '자동 취소 · 결제 0원' },
      { icon: 'refund' as const, tone: 'warn' as const, when: `결제 후 ${RULES.receiptDueHours}시간`, what: '구매 인증이 없으면', result: '자동 취소 · 100% 환불' },
      { icon: 'check' as const, tone: 'accent' as const, when: `전달 후 ${RULES.confirmDueHours}시간`, what: '수령 확인이 없으면', result: '자동 수령 · 여행자 정산' },
    ],
    proofTitle: '사진 3장이 증거가 돼요',
    proofs: [
      { icon: 'camera' as const, title: '① 구매 인증', desc: '매장에서 물품+영수증을 한 장에', must: '없으면 다음 단계 진행 불가' },
      { icon: 'box' as const, title: '② 포장 인증', desc: '전달 직전 물품 상태', must: '파손 분쟁 방지' },
      { icon: 'qr' as const, title: '③ 수령 인증', desc: '현장에서 수령 코드 입력 또는 수령 사진', must: '코드 입력 즉시 거래 완료' },
    ],
    proofNote: '분쟁이 생기면 시스템에 남은 사진 기록대로 처리돼요.',
    buyTitle: '구매 전 꼭 확인하세요',
    buy: [
      { icon: 'coin' as const, tone: 'warn' as const, title: '관세·세금은 구매자 부담', desc: '면세 한도를 넘으면 예상 세금에 동의해야 다음 단계로 넘어가요.' },
      { icon: 'ban' as const, tone: 'danger' as const, title: '금지 품목은 자동 차단', desc: '육포·생과일·처방 의약품·모조품·무기류·주류·담배는 요청 자체가 안 돼요.' },
      { icon: 'shield' as const, tone: 'ink' as const, title: 'TripCarry는 중개자예요', desc: '매칭과 에스크로만 제공해요. 통관·세관 신고의 주체는 아니에요.' },
      { icon: 'stop' as const, tone: 'danger' as const, title: '노쇼는 자동 제재', desc: `기한 안에 구매 인증이 없으면 보증금 몰수와 ${RULES.noShowSuspendDays}일 정지.` },
      { icon: 'star' as const, tone: 'warn' as const, title: `평점 ${RULES.minRating.toFixed(1)} 이하는 매칭 제한`, desc: `후기 ${RULES.minReviews}개 이상 쌓인 사용자부터 적용돼요.` },
      { icon: 'chat' as const, tone: 'accent' as const, title: '문의는 직접 · 자동으로', desc: '장소·시간은 상대방과 1:1 채팅, 자주 묻는 질문은 도움말에서 바로.' },
    ],
    more: '전체 이용약관 보기',
    help: '도움말 (자주 묻는 질문)',
  },
  en: {
    autoTitle: 'No middleman — rules run automatically',
    timeline: [
      { icon: 'clock' as const, tone: 'ink' as const, when: `${RULES.matchCutoffHours}h before your date`, what: 'No traveler matched?', result: 'Auto-cancelled · $0 charged' },
      { icon: 'refund' as const, tone: 'warn' as const, when: `${RULES.receiptDueHours}h after payment`, what: 'No purchase proof?', result: 'Auto-cancelled · 100% refund' },
      { icon: 'check' as const, tone: 'accent' as const, when: `${RULES.confirmDueHours}h after hand-off`, what: 'Not confirmed?', result: 'Auto-confirmed · traveler paid' },
    ],
    proofTitle: 'Three photos are the proof',
    proofs: [
      { icon: 'camera' as const, title: '① Purchase proof', desc: 'Item + receipt in one photo, in store', must: 'Required to move on' },
      { icon: 'box' as const, title: '② Packing proof', desc: 'Condition right before hand-off', must: 'Prevents damage disputes' },
      { icon: 'qr' as const, title: '③ Receipt proof', desc: 'Enter the hand-off code, or a hand-off photo', must: 'Code = instant completion' },
    ],
    proofNote: 'If there’s a dispute, the photo record decides.',
    buyTitle: 'Before you buy',
    buy: [
      { icon: 'coin' as const, tone: 'warn' as const, title: 'Duties are paid by the buyer', desc: 'Over the duty-free limit? You must accept the estimated tax to continue.' },
      { icon: 'ban' as const, tone: 'danger' as const, title: 'Banned items are blocked', desc: 'Jerky, fresh fruit, prescription drugs, counterfeits, weapons, alcohol and tobacco can’t be requested.' },
      { icon: 'shield' as const, tone: 'ink' as const, title: 'TripCarry is an intermediary', desc: 'We provide matching and escrow only — not customs clearance or declarations.' },
      { icon: 'stop' as const, tone: 'danger' as const, title: 'No-shows are penalized automatically', desc: `No purchase proof in time: deposit forfeited and a ${RULES.noShowSuspendDays}-day suspension.` },
      { icon: 'star' as const, tone: 'warn' as const, title: `Rating ${RULES.minRating.toFixed(1)} or below can’t match`, desc: `Applies once a user has ${RULES.minReviews}+ reviews.` },
      { icon: 'chat' as const, tone: 'accent' as const, title: 'Sort things out directly', desc: '1:1 chat for place and time; instant answers in Help.' },
    ],
    more: 'Read the full Terms',
    help: 'Help (FAQ)',
  },
};

export function AutoRules({ lang }: { lang: Lang }) {
  const t = TX[lang];
  return (
    <div className="rv-auto">
      <div className="card rv-panel">
        <h2 className="lp-h2">{t.autoTitle}</h2>
        <ol className="rv-timeline">
          {t.timeline.map((x) => (
            <li key={x.when}>
              <Icon name={x.icon} tone={x.tone} />
              <span className="rv-when">{x.when}</span>
              <span className="rv-what">{x.what}</span>
              <strong className={`rv-result rv-${x.tone}-text`}>{x.result}</strong>
            </li>
          ))}
        </ol>
      </div>
      <div className="card rv-panel">
        <h2 className="lp-h2">{t.proofTitle}</h2>
        <ol className="rv-proofs">
          {t.proofs.map((p) => (
            <li key={p.title}>
              <Icon name={p.icon} />
              <strong>{p.title}</strong>
              <span>{p.desc}</span>
              <em>{p.must}</em>
            </li>
          ))}
        </ol>
        <p className="small muted">{t.proofNote}</p>
      </div>
    </div>
  );
}

export function BeforeYouBuy({ lang, compact }: { lang: Lang; compact?: boolean }) {
  const t = TX[lang];
  return (
    <div className={`rv-buy${compact ? ' compact' : ''}`}>
      {!compact && <h2 className="lp-h2">{t.buyTitle}</h2>}
      <ul className="rv-buy-grid">
        {t.buy.map((b) => (
          <li key={b.title}>
            <Icon name={b.icon} tone={b.tone} />
            <div>
              <strong>{b.title}</strong>
              <span>{b.desc}</span>
            </div>
          </li>
        ))}
      </ul>
      <p className="rv-links small">
        <Link href="/terms" target={compact ? '_blank' : undefined}>{t.more} →</Link>
        <Link href="/help" target={compact ? '_blank' : undefined}>{t.help} →</Link>
      </p>
    </div>
  );
}
