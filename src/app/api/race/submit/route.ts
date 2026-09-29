import { NextResponse } from 'next/server';
import { claimNonce, cleanName, clientIp, isBanned, raceConfigured, rateLimited, saveTime, topEntries, verifyResult } from '@/lib/race';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!raceConfigured()) return NextResponse.json({ error: 'race offline' }, { status: 503 });
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }
  const name = cleanName(body.name);
  if (!name) return NextResponse.json({ error: 'name not allowed' }, { status: 400 });

  let result;
  try {
    result = await verifyResult(String(body.result ?? ''));
  } catch {
    return NextResponse.json({ error: 'invalid or expired result' }, { status: 400 });
  }
  try {
    if (await rateLimited(`submit:${clientIp(request)}`, 15, 600)) {
      return NextResponse.json({ error: 'too many submissions, try again later' }, { status: 429 });
    }
    if (await isBanned(name)) return NextResponse.json({ error: 'name not allowed' }, { status: 400 });
    if (!(await claimNonce('submit', result.nonce))) {
      return NextResponse.json({ error: 'already submitted' }, { status: 409 });
    }
    const saved = await saveTime(result.year, name, result.ms);
    return NextResponse.json({ name, ms: result.ms, ...saved, year: result.year, top: await topEntries(result.year) });
  } catch (err) {
    console.error('race/submit', err);
    return NextResponse.json({ error: 'race offline' }, { status: 503 });
  }
}
