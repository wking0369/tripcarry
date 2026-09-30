import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { readSignups } from '@/lib/data';

const COLS = ['at', 'email', 'role', 'from', 'to', 'item', 'pay', 'src', 'lang'] as const;

function cell(v: string) {
  // 엑셀 수식으로 해석되지 않도록 앞에 '를 붙이고, 따옴표는 이스케이프
  const safe = /^[=+\-@]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const rows = await readSignups();
  const csv = [COLS.join(','), ...rows.map((r) => COLS.map((c) => cell(String(r[c] ?? ''))).join(','))].join('\r\n');
  return new NextResponse('﻿' + csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="tripcarry-waitlist-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
