import redis from './redis';
import sql from './db';
import { BlogPost } from '@/types';

const TTL = 60 * 60 * 24 * 7; // 7 hari — diinvalidasi otomatis saat admin update

const KEYS = {
  list:   'blog:posts',
  post:   (slug: string) => `blog:post:${slug}`,
  series: (name: string) => `blog:series:${name}`,
};

/* ── Ambil semua post published ── */
export async function getCachedPosts(): Promise<BlogPost[]> {
  try {
    const cached = await redis.get<BlogPost[]>(KEYS.list);
    if (cached) return cached;
  } catch {
    // Redis error → fallback ke DB
  }

  const rows = await sql`
    SELECT id, title, slug, excerpt, tags, cover_image, is_published, published_at, created_at, updated_at,
           series, series_order
    FROM blog_posts
    WHERE is_published = true
    ORDER BY published_at DESC NULLS LAST
  `;

  const posts = rows as unknown as BlogPost[];

  try {
    await redis.set(KEYS.list, posts, { ex: TTL });
  } catch { /* silent */ }

  return posts;
}

/* ── Ambil 1 post by slug ── */
export async function getCachedPost(slug: string): Promise<BlogPost | null> {
  try {
    const cached = await redis.get<BlogPost>(KEYS.post(slug));
    if (cached) return cached;
  } catch { /* silent */ }

  const [row] = await sql`
    SELECT id, title, slug, content, excerpt, tags, cover_image, is_published, published_at, created_at, updated_at,
           series, series_order
    FROM blog_posts
    WHERE slug = ${slug} AND is_published = true
    LIMIT 1
  ` as unknown as BlogPost[];

  if (!row) return null;

  try {
    await redis.set(KEYS.post(slug), row, { ex: TTL });
  } catch { /* silent */ }

  return row;
}

/* ── Ambil semua post dalam satu seri (diurutkan by series_order) ── */
export async function getCachedSeriesPosts(series: string): Promise<BlogPost[]> {
  try {
    const cached = await redis.get<BlogPost[]>(KEYS.series(series));
    if (cached) return cached;
  } catch { /* silent */ }

  const rows = await sql`
    SELECT id, title, slug, excerpt, tags, cover_image, is_published, published_at, created_at, updated_at,
           series, series_order
    FROM blog_posts
    WHERE is_published = true AND series = ${series}
    ORDER BY series_order ASC NULLS LAST
  `;

  const posts = rows as unknown as BlogPost[];

  try {
    await redis.set(KEYS.series(series), posts, { ex: TTL });
  } catch { /* silent */ }

  return posts;
}

/* ── Invalidate cache (dipanggil saat admin update/create/delete) ── */
export async function invalidateBlogCache(slug?: string, series?: string) {
  try {
    const keys: string[] = [KEYS.list];
    if (slug)   keys.push(KEYS.post(slug));
    if (series) keys.push(KEYS.series(series));
    await redis.del(...keys);
  } catch { /* silent */ }
}
