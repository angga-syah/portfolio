import { NextResponse } from 'next/server';
import { sendContactEmail } from '@/lib/email';

function clip(s: unknown, max: number) {
  return String(s ?? '').trim().slice(0, max);
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  const name    = clip(body.name, 120);
  const email   = clip(body.email, 160);
  const message = clip(body.message, 4000);

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Format email tidak valid' }, { status: 400 });
  }

  // Cloudflare Turnstile verification
  const tsSecret = process.env.TURNSTILE_SECRET_KEY;
  if (tsSecret) {
    const turnstileToken = clip(body.turnstileToken, 4000);
    if (!turnstileToken) {
      return NextResponse.json({ error: 'captcha required' }, { status: 400 });
    }
    try {
      const params = new URLSearchParams();
      params.append('secret', tsSecret);
      params.append('response', turnstileToken);
      const vr = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: params,
      });
      const vj = (await vr.json()) as { success?: boolean };
      if (!vj.success) {
        return NextResponse.json({ error: 'captcha failed' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'captcha error' }, { status: 400 });
    }
  }

  try {
    await sendContactEmail(name, email, message);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json({ error: 'Gagal mengirim pesan. Silakan coba lagi.' }, { status: 500 });
  }
}
