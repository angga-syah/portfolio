import { SignJWT, jwtVerify } from 'jose';
import redis from '@/lib/redis';
import { isBlockedName } from '@/lib/nameFilter';

// Coin-race leaderboard. Times are measured on the server: /start hands out a
// signed token stamped with the start time, /finish turns it into a signed
// result (so typing a name afterwards doesn't count), /submit stores it.
// Boards are keyed per calendar year (Asia/Jakarta), so they reset on 1 Jan.

export const MIN_RACE_MS = 15_000; // faster than this isn't physically possible
export const MAX_RACE_MS = 30 * 60_000;
const BOARD_TTL_S = 60 * 60 * 24 * 800; // keep last year's board around for its champion

export function raceConfigured() {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN && process.env.JWT_SECRET);
}

function secret() {
  return new TextEncoder().encode(`${process.env.JWT_SECRET}:race`);
}

export function raceYear(date = new Date()) {
  return Number(new Intl.DateTimeFormat('en', { timeZone: 'Asia/Jakarta', year: 'numeric' }).format(date));
}

export const boardKey = (year: number) => `race:${year}`;

export async function signStart() {
  const nonce = crypto.randomUUID();
  const token = await new SignJWT({ start: Date.now(), nonce, year: raceYear() })
    .setProtectedHeader({ alg: 'HS256' })
    .setAudience('race-start')
    .setExpirationTime('35m')
    .sign(secret());
  return token;
}

export async function verifyStart(token: string) {
  const { payload } = await jwtVerify(token, secret(), { audience: 'race-start' });
  return payload as { start: number; nonce: string; year: number };
}

export async function signResult(ms: number, nonce: string, year: number) {
  return new SignJWT({ ms, nonce, year })
    .setProtectedHeader({ alg: 'HS256' })
    .setAudience('race-result')
    .setExpirationTime('15m')
    .sign(secret());
}

export async function verifyResult(token: string) {
  const { payload } = await jwtVerify(token, secret(), { audience: 'race-result' });
  return payload as { ms: number; nonce: string; year: number };
}

/** True the first time a nonce is seen for `purpose`; false on replays. */
export async function claimNonce(purpose: string, nonce: string) {
  const ok = await redis.set(`race:nonce:${purpose}:${nonce}`, 1, { nx: true, ex: 3600 });
  return ok === 'OK';
}

/** Fixed-window limiter: at most `limit` hits per `windowS` per key. */
export async function rateLimited(key: string, limit: number, windowS: number) {
  const k = `race:rl:${key}`;
  const n = await redis.incr(k);
  if (n === 1) await redis.expire(k, windowS);
  return n > limit;
}

export function clientIp(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

/** Uppercase letters/digits/space/.-_, 3–12 chars, nothing rude (see nameFilter). Returns null if not allowed. */
export function cleanName(raw: unknown) {
  const name = String(raw ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ._-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 12);
  if (name.length < 3 || isBlockedName(name)) return null;
  return name;
}

export type Entry = { name: string; ms: number };

function pairs(flat: (string | number)[]): Entry[] {
  const out: Entry[] = [];
  for (let i = 0; i + 1 < flat.length; i += 2) out.push({ name: String(flat[i]), ms: Number(flat[i + 1]) });
  return out;
}

export async function topEntries(year: number, count = 10) {
  const flat = await redis.zrange<(string | number)[]>(boardKey(year), 0, count - 1, { withScores: true });
  return pairs(flat);
}

const BANNED_KEY = 'race:banned';

/** Names an admin removed and blocked from being used again. */
export async function isBanned(name: string) {
  return (await redis.sismember(BANNED_KEY, name)) === 1;
}

/** Admin moderation: drop a name from a year's board, optionally ban it for good. */
export async function removeEntry(year: number, name: string, ban: boolean) {
  await redis.zrem(boardKey(year), name);
  if (ban) await redis.sadd(BANNED_KEY, name);
}

export async function saveTime(year: number, name: string, ms: number) {
  const key = boardKey(year);
  // LT: only overwrite a name's time when the new one is faster.
  await redis.zadd(key, { lt: true }, { score: ms, member: name });
  await redis.expire(key, BOARD_TTL_S);
  const [rank, best, total] = await Promise.all([redis.zrank(key, name), redis.zscore(key, name), redis.zcard(key)]);
  return { rank: rank === null ? null : rank + 1, best: best === null ? ms : Number(best), total };
}
