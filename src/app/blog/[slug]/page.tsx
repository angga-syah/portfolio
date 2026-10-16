import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCachedPost, getCachedSeriesPosts } from '@/lib/blogCache';
import BlogPost from '@/components/Blog/BlogPost';
import SeriesSidebar from '@/components/Blog/SeriesSidebar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getCachedPost(slug);
  if (!post) return { title: 'Tidak Ditemukan' };
  return {
    title: `${post.title} | Angga Rakhmansyah`,
    description: post.excerpt ?? '',
    openGraph: {
      title: post.title,
      description: post.excerpt ?? '',
      ...(post.cover_image && { images: [{ url: post.cover_image }] }),
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  // Fetch post first, then series posts in parallel if applicable
  const post = await getCachedPost(slug);
  if (!post) notFound();

  // Fetch series posts from dedicated cache key (efficient — tidak load semua post)
  const seriesPosts = post.series
    ? await getCachedSeriesPosts(post.series)
    : [];

  const hasSeries = seriesPosts.length > 1;

  return (
    <main className="min-h-screen flex flex-col bg-zinc-950">
      <Header />
      <div className="flex-1 pt-24 pb-20">
        <div className="container mx-auto px-4">
          <div className={hasSeries ? 'lg:grid lg:grid-cols-[1fr_288px] lg:gap-10 lg:items-start' : ''}>
            {/* Main content */}
            <div>
              <BlogPost post={post} />
            </div>

            {/* Series sidebar */}
            {hasSeries && (
              <aside className="lg:sticky lg:top-28">
                <SeriesSidebar posts={seriesPosts} currentSlug={slug} />
              </aside>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
