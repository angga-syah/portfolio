interface Attempt {
  count: number;
  firstAttempt: number;
  blocked: boolean;
  blockedAt?: number;
}

const store = new Map<string, Attempt>();

const MAX_ATTEMPTS  = 5;
const WINDOW_MS     = 15 * 60 * 1000; // 15 menit
const BLOCK_MS      = 15 * 60 * 1000; // block 15 menit

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; retryAfter?: number } {
  const now = Date.now();
  const entry = store.get(ip);

  // Kalau sedang diblokir
  if (entry?.blocked && entry.blockedAt) {
    const elapsed = now - entry.blockedAt;
    if (elapsed < BLOCK_MS) {
      const retryAfter = Math.ceil((BLOCK_MS - elapsed) / 1000);
      return { allowed: false, remaining: 0, retryAfter };
    }
    // Block sudah expired, reset
    store.delete(ip);
  }

  // Belum ada entry atau window sudah expired
  if (!entry || now - entry.firstAttempt > WINDOW_MS) {
    store.set(ip, { count: 1, firstAttempt: now, blocked: false });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  // Tambah count
  entry.count += 1;

  if (entry.count > MAX_ATTEMPTS) {
    entry.blocked = true;
    entry.blockedAt = now;
    store.set(ip, entry);
    return { allowed: false, remaining: 0, retryAfter: Math.ceil(BLOCK_MS / 1000) };
  }

  store.set(ip, entry);
  return { allowed: true, remaining: MAX_ATTEMPTS - entry.count };
}

export function resetRateLimit(ip: string) {
  store.delete(ip);
}
