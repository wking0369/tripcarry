'use client';

import { useRef, useState } from 'react';
import { fmtNum } from '@/lib/hub/types';

const W = 560;
const H = 240;
const PAD = { l: 48, r: 10, t: 12, b: 26 };

function ticks(lo: number, hi: number, n = 4) {
  if (hi === lo) return [lo];
  const raw = (hi - lo) / n;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-6; v += step) out.push(v);
  return out;
}

const short = (date: string) => `${Number(date.slice(5, 7))}/${Number(date.slice(8))}`;

/** 팔로워 수 한 줄. 위에 올리면 날짜와 값이 나온다. */
export function FollowerChart({ data }: { data: { date: string; followers: number }[] }) {
  const svg = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  if (data.length < 2) return <p className="empty-line">팔로워 기록이 이틀 이상 있어야 그래프가 나와요.</p>;
  const lo = Math.min(...data.map((d) => d.followers));
  const hi = Math.max(...data.map((d) => d.followers));
  const span = hi - lo || 1;
  const bottom = lo - span * 0.1;
  const top = hi + span * 0.05;
  const x = (i: number) => PAD.l + (i / (data.length - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - bottom) / (top - bottom)) * (H - PAD.t - PAD.b);
  const line = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(d.followers).toFixed(1)}`).join('');
  const every = Math.max(1, Math.ceil(data.length / 6));
  const h = hover === null ? null : data[hover];
  return (
    <div className="chart">
      <svg
        ref={svg}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`팔로워 수 추이, ${short(data[0].date)} ${data[0].followers.toLocaleString('ko-KR')}명에서 ${short(data[data.length - 1].date)} ${data[data.length - 1].followers.toLocaleString('ko-KR')}명`}
        onPointerMove={(e) => {
          const r = svg.current!.getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W;
          setHover(Math.max(0, Math.min(data.length - 1, Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * (data.length - 1)))));
        }}
        onPointerLeave={() => setHover(null)}
      >
        {ticks(bottom, top).map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} className="grid" />
            <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end" className="tick">{fmtNum(t)}</text>
          </g>
        ))}
        {data.map((d, i) => (i % every === 0 ? <text key={d.date} x={x(i)} y={H - 6} textAnchor="middle" className="tick">{short(d.date)}</text> : null))}
        <path d={line} className="line" />
        {hover !== null && h && (
          <>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} className="cross" />
            <circle cx={x(hover)} cy={y(h.followers)} r={5} className="dot" />
          </>
        )}
      </svg>
      {h && hover !== null && (
        <div className="tip" style={{ left: `${(x(hover) / W) * 100}%` }}>
          <b>{h.followers.toLocaleString('ko-KR')}명</b>
          <span>{h.date}</span>
        </div>
      )}
    </div>
  );
}

/** 주별 조회수 막대. 게시일 기준으로 묶는다. */
export function WeeklyChart({ data }: { data: { week: string; views: number; posts: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  if (!data.some((d) => d.views > 0)) return <p className="empty-line">수치가 입력된 게시물이 없어요.</p>;
  const hi = Math.max(...data.map((d) => d.views));
  const tk = ticks(0, hi, 3);
  const top = Math.max(hi, tk[tk.length - 1]);
  const y = (v: number) => PAD.t + (1 - v / top) * (H - PAD.t - PAD.b);
  const band = (W - PAD.l - PAD.r) / data.length;
  const barW = Math.min(36, Math.max(4, band - 2));
  const every = Math.max(1, Math.ceil(data.length / 7));
  const h = hover === null ? null : data[hover];
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="주별 조회수 막대 그래프" onPointerLeave={() => setHover(null)}>
        {tk.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} className="grid" />
            <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end" className="tick">{fmtNum(t)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = PAD.l + band * i + band / 2;
          const yy = y(d.views);
          const bh = H - PAD.b - yy;
          const r = Math.min(4, bh);
          return (
            <g key={d.week} onPointerEnter={() => setHover(i)}>
              <rect x={PAD.l + band * i} y={PAD.t} width={band} height={H - PAD.t - PAD.b} fill="transparent" />
              {bh > 0 && <path className={hover === null || hover === i ? 'bar' : 'bar bar-dim'} d={`M${cx - barW / 2} ${H - PAD.b}V${yy + r}Q${cx - barW / 2} ${yy} ${cx - barW / 2 + r} ${yy}H${cx + barW / 2 - r}Q${cx + barW / 2} ${yy} ${cx + barW / 2} ${yy + r}V${H - PAD.b}Z`} />}
              {i % every === 0 && <text x={cx} y={H - 6} textAnchor="middle" className="tick">{short(d.week)}</text>}
            </g>
          );
        })}
      </svg>
      {h && hover !== null && (
        <div className="tip" style={{ left: `${((PAD.l + band * hover + band / 2) / W) * 100}%` }}>
          <b>{h.views.toLocaleString('ko-KR')}회</b>
          <span>{short(h.week)} 주 · 게시물 {h.posts}개</span>
        </div>
      )}
    </div>
  );
}
