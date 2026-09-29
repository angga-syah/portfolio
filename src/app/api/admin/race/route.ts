import { NextResponse } from 'next/server';
import { getAdminFromCookie } from '@/lib/auth';
import { raceConfigured, raceYear, removeEntry, topEntries } from '@/lib/race';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!(await getAdminFromCookie())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!raceConfigured()) return NextResponse.json({ error: 'Redis/JWT belum dikonfigurasi' }, { status: 503 });
  const year = Number(new URL(request.url).searchParams.get('year')) || raceYear();
  try {
    return NextResponse.json({ year, entries: await topEntries(year, 200) });
  } catch (err) {
    console.error('admin race GET', err);
    return NextResponse.json({ error: 'Gagal memuat leaderboard' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await getAdminFromCookie())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!raceConfigured()) return NextResponse.json({ error: 'Redis/JWT belum dikonfigurasi' }, { status: 503 });
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }
  const year = Number(body.year);
  const name = String(body.name ?? '').slice(0, 12);
  if (!year || !name) return NextResponse.json({ error: 'year dan name wajib' }, { status: 400 });
  try {
    await removeEntry(year, name, body.ban === true);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('admin race DELETE', err);
    return NextResponse.json({ error: 'Gagal menghapus' }, { status: 500 });
  }
}
