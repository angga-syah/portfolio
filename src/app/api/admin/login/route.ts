import { NextRequest, NextResponse } from 'next/server';
import { createAdminToken, COOKIE_NAME } from '@/lib/auth';
import { checkRateLimit, resetRateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  // Ambil IP dari header (Vercel / proxy)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp    = request.headers.get('x-real-ip');
  const ip        = (forwarded?.split(',')[0]?.trim()) ?? realIp ?? 'unknown';

  // Cek rate limit
  const { allowed, remaining, retryAfter } = checkRateLimit(ip);

  if (!allowed) {
    return NextResponse.json(
      { error: `Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil((retryAfter ?? 900) / 60)} menit.` },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter ?? 900),
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  try {
    const { password } = await request.json();

    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Password salah', attemptsRemaining: remaining - 1 },
        { status: 401 }
      );
    }

    // Login berhasil — reset rate limit untuk IP ini
    resetRateLimit(ip);

    const token = await createAdminToken();
    const response = NextResponse.json({ success: true });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
