import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getAdminFromCookie } from '@/lib/auth';
import { invalidateBlogCache } from '@/lib/blogCache';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const isAdmin = await getAdminFromCookie();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const [post] = await sql`SELECT * FROM blog_posts WHERE id = ${id}`;
    if (!post) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
    return NextResponse.json(post);
  } catch (error) {
    console.error('Admin GET post error:', error);
    return NextResponse.json({ error: 'Gagal memuat postingan' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  const isAdmin = await getAdminFromCookie();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const { title, slug, content, excerpt, tags, cover_image, is_published, series, series_order } = await request.json();

    if (!title?.trim() || !slug?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Judul, slug, dan konten wajib diisi' }, { status: 400 });
    }

    const [post] = await sql`
      UPDATE blog_posts
      SET
        title        = ${title.trim()},
        slug         = ${slug.trim()},
        content      = ${content},
        excerpt      = ${excerpt ?? null},
        tags         = ${tags ?? []},
        cover_image  = ${cover_image ?? null},
        is_published = ${is_published},
        published_at = CASE
          WHEN ${is_published}::boolean AND published_at IS NULL THEN NOW()
          ELSE published_at
        END,
        series       = ${series ?? null},
        series_order = ${series_order ?? null},
        updated_at   = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!post) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });

    // Invalidate cache list + post + series
    await invalidateBlogCache(slug.trim(), series ?? undefined);

    return NextResponse.json(post);
  } catch (error: any) {
    console.error('Admin PUT post error:', error);
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Slug sudah digunakan' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Gagal memperbarui postingan' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const isAdmin = await getAdminFromCookie();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    // Ambil slug & series dulu sebelum dihapus (untuk invalidate cache)
    const [existing] = await sql`SELECT slug, series FROM blog_posts WHERE id = ${id}`;
    await sql`DELETE FROM blog_posts WHERE id = ${id}`;

    await invalidateBlogCache(existing?.slug, existing?.series);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin DELETE post error:', error);
    return NextResponse.json({ error: 'Gagal menghapus postingan' }, { status: 500 });
  }
}
