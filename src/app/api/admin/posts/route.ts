import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getAdminFromCookie } from '@/lib/auth';
import { invalidateBlogCache } from '@/lib/blogCache';

export async function GET() {
  const isAdmin = await getAdminFromCookie();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const posts = await sql`
      SELECT id, title, slug, excerpt, tags, cover_image, is_published, published_at, created_at, updated_at
      FROM blog_posts
      ORDER BY created_at DESC
    `;
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Admin GET posts error:', error);
    return NextResponse.json({ error: 'Gagal memuat postingan' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const isAdmin = await getAdminFromCookie();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { title, slug, content, excerpt, tags, cover_image, is_published, series, series_order } = await request.json();

    if (!title?.trim() || !slug?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Judul, slug, dan konten wajib diisi' }, { status: 400 });
    }

    const published_at = is_published ? new Date() : null;

    const [post] = await sql`
      INSERT INTO blog_posts (title, slug, content, excerpt, tags, cover_image, is_published, published_at, series, series_order)
      VALUES (
        ${title.trim()}, ${slug.trim()}, ${content}, ${excerpt ?? null},
        ${tags ?? []}, ${cover_image ?? null}, ${is_published}, ${published_at},
        ${series ?? null}, ${series_order ?? null}
      )
      RETURNING *
    `;

    await invalidateBlogCache(undefined, series ?? undefined);
    return NextResponse.json(post, { status: 201 });
  } catch (error: any) {
    console.error('Admin POST post error:', error);
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Slug sudah digunakan' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Gagal membuat postingan' }, { status: 500 });
  }
}
