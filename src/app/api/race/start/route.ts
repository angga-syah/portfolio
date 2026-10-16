import { NextResponse } from 'next/server';
import { clientIp, raceConfigured, rateLimited, signStart } from '@/lib/race';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!raceConfigured()) return NextResponse.json({ error: 'race offline' }, { status: 503 });
  try {
    if (await rateLimited(`start:${clientIp(request)}`, 30, 600)) {
      return NextResponse.json({ error: 'too many races, try again later' }, { status: 429 });
    }
    return NextResponse.json({ token: await signStart() });
  } catch (err) {
    console.error('race/start', err);
    return NextResponse.json({ error: 'race offline' }, { status: 503 });
  }
}
