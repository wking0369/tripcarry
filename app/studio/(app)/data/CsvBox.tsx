'use client';

import { useRef } from 'react';

// CSV 파일을 고르면 내용을 아래 칸에 채운다. 붙여넣기도 된다.
export default function CsvBox({ name = 'csv', placeholder }: { name?: string; placeholder: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  return (
    <>
      <label className="btn btn-small file-btn">
        CSV 파일 고르기
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file && ref.current) ref.current.value = await file.text();
          }}
        />
      </label>
      <label>CSV 내용<textarea ref={ref} name={name} rows={6} placeholder={placeholder} required /></label>
    </>
  );
}
