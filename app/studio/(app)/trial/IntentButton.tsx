'use client';

// 같은 폼에서 "승인"과 "초안 저장"을 구분한다. 폼의 숨은 intent 칸에 값을 넣고 제출한다.
export default function IntentButton({ intent, className, children }: { intent: string; className: string; children: React.ReactNode }) {
  return (
    <button
      className={className}
      type="submit"
      onClick={(e) => {
        const field = e.currentTarget.form?.elements.namedItem('intent');
        if (field instanceof HTMLInputElement) field.value = intent;
      }}
    >
      {children}
    </button>
  );
}
