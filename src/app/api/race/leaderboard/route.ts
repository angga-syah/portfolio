import { NextResponse } from 'next/server';
import { raceConfigured, raceYear, topEntries } from '@/lib/race';

export const dynamic = 'force-dynamic';

export async function GET() {
  const year = raceYear();
  if (!raceConfigured()) return NextResponse.json({ year, top: [], champion: null, offline: true });
  try {
    const [top, last] = await Promise.all([topEntries(year), topEntries(year - 1, 1)]);
    return NextResponse.json({ year, top, champion: last[0] ? { ...last[0], year: year - 1 } : null }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('race/leaderboard', err);
    return NextResponse.json({ year, top: [], champion: null, offline: true });
  }
}
