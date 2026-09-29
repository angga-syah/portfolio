import { NextResponse } from 'next/server';
import { MAX_RACE_MS, MIN_RACE_MS, claimNonce, raceConfigured, signResult, verifyStart } from '@/lib/race';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!raceConfigured()) return NextResponse.json({ error: 'race offline' }, { status: 503 });
  let token: string;
  try {
    token = String((await request.json()).token ?? '');
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }
  const now = Date.now();
  let start;
  try {
    start = await verifyStart(token);
  } catch {
    return NextResponse.json({ error: 'invalid or expired race' }, { status: 400 });
  }
  const ms = now - start.start;
  if (ms < MIN_RACE_MS || ms > MAX_RACE_MS) {
    return NextResponse.json({ error: 'time not accepted' }, { status: 400 });
  }
  try {
    if (!(await claimNonce('finish', start.nonce))) {
      return NextResponse.json({ error: 'race already finished' }, { status: 409 });
    }
    return NextResponse.json({ ms, result: await signResult(ms, start.nonce, start.year) });
  } catch (err) {
    console.error('race/finish', err);
    return NextResponse.json({ error: 'race offline' }, { status: 503 });
  }
}
