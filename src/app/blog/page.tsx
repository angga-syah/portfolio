import type { Metadata } from 'next';
import { BookOpen, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getCachedPosts } from '@/lib/blogCache';
import BlogCard from '@/components/Blog/BlogCard';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Blog & Catatan | Angga Rakhmansyah',
  description: 'Tulisan pribadi tentang teknologi, pemrograman, dan hal-hal menarik lainnya.',
};

export default async function BlogPage() {
  const posts = await getCachedPosts();

  // Kumpulkan unique series dari semua post
  const seriesMap = new Map<string, { count: number; firstSlug: string; label: string }>();
  for (const p of posts) {
    if (!p.series) continue;
    const existing = seriesMap.get(p.series);
    if (!existing) {
      // Derive display label dari slug
      const label = p.series.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      seriesMap.set(p.series, { count: 1, firstSlug: p.slug, label });
    } else {
      existing.count++;
      // Ambil post paling awal (series_order terkecil) sebagai entry point
      const existingOrder = posts.find(x => x.slug === existing.firstSlug)?.series_order ?? 0;
      const thisOrder = p.series_order ?? 0;
      if (thisOrder < existingOrder) existing.firstSlug = p.slug;
    }
  }
  const seriesList = Array.from(seriesMap.entries());
  const hasSeries = seriesList.length > 0;

  return (
    <main className="min-h-screen flex flex-col bg-zinc-950">
      <Header />

      <div className="flex-1 pt-24 pb-20">
        <div className="container mx-auto px-4">

          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <BookOpen size={17} className="text-emerald-500" />
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-semibold text-zinc-100">
                Catatan & Tulisan
              </h1>
            </div>
            <p className="text-zinc-500 max-w-xl">
              Tulisan pribadi tentang teknologi, pemrograman, dan hal-hal menarik lainnya
            </p>
          </div>

          {/* Disclaimer */}
          <div className="mb-10 flex items-start gap-3 px-4 py-3.5 rounded-lg border border-amber-500/20 bg-amber-500/5">
            <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-sm text-zinc-500 leading-relaxed">
              <span className="text-amber-400 font-medium">Catatan: </span>
              Tulisan di sini adalah eksplorasi pribadi yang menggabungkan sains, filsafat, dan spiritualitas.
              Konten belum melalui kajian ilmiah formal — beberapa data dan interpretasi bersifat spekulatif
              atau merupakan analogi, bukan klaim sains yang sudah dikonfirmasi. Baca dengan kritis.
            </p>
          </div>

          {/* 2-col layout: posts grid + series sidebar */}
          <div className={hasSeries ? 'lg:grid lg:grid-cols-[1fr_288px] lg:gap-10 lg:items-start' : ''}>

            {/* Posts grid */}
            {posts.length === 0 ? (
              <div className="py-24 text-center">
                <p className="text-zinc-500 mb-1">Belum ada tulisan</p>
                <p className="text-zinc-700 text-sm font-data">Segera hadir</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-5">
                {posts.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            )}

            {/* Series sidebar — hanya nama seri & jumlah post */}
            {hasSeries && (
              <aside className="mt-8 lg:mt-0 lg:sticky lg:top-28 space-y-3">
                <p className="text-xs text-zinc-600 uppercase tracking-widest font-medium px-1">Seri Tulisan</p>
                {seriesList.map(([slug, { count, firstSlug, label }]) => (
                  <div key={slug} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-7 h-7 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <BookOpen size={13} className="text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-100 leading-snug">{label}</p>
                        <p className="text-xs text-zinc-600 font-data mt-0.5">{count} post</p>
                      </div>
                    </div>
                    <Link
                      href={`/blog/${firstSlug}`}
                      className="flex items-center gap-1.5 text-xs text-emerald-500 hover:text-emerald-400 transition-colors font-medium"
                    >
                      Mulai baca dari #1
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                ))}
              </aside>
            )}

          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
