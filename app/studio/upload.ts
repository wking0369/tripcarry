'use client';

// 사진을 올리기 전에 브라우저에서 줄여서(긴 변 1600px) JPEG로 바꾼다. 용량과 AI 비용을 줄인다.
export async function shrink(file: File, max = 1600): Promise<Blob> {
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) throw new Error('이미지를 읽지 못했어요. JPG·PNG·WEBP 파일을 골라 주세요.');
  const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * s);
  canvas.height = Math.round(bmp.height * s);
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('이미지 변환 실패'))), 'image/jpeg', 0.85));
}

export async function uploadImage(file: File): Promise<string> {
  const blob = await shrink(file);
  const res = await fetch('/api/studio/assets', { method: 'POST', headers: { 'content-type': 'image/jpeg' }, body: blob });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || '사진을 올리지 못했어요.');
  return data.id as string;
}
