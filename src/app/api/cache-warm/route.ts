import { NextRequest, NextResponse } from 'next/server';
import { getCachedPosts, getCachedPost, invalidateBlogCache } from '@/lib/blogCache';

// Dipanggil setelah deploy untuk mengisi cache sebelum ada user yang masuk
// Protected dengan secret supaya tidak bisa dipanggil sembarangan
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-warm-secret');
  if (secret !== process.env.CACHE_WARM_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Kosongkan cache lama dulu
    await invalidateBlogCache();

    // Warm list
    const posts = await getCachedPosts();

    // Warm tiap post individual secara paralel
    await Promise.all(posts.map((p) => getCachedPost(p.slug)));

    return NextResponse.json({
      success: true,
      warmed: posts.length,
      posts: posts.map((p) => p.slug),
    });
  } catch (err) {
    console.error('Cache warm error:', err);
    return NextResponse.json({ error: 'Gagal warm cache' }, { status: 500 });
  }
}
