import Header from '@/components/Header';
import Footer from '@/components/Footer';

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-zinc-800 ${className ?? ''}`} />;
}

export default function BlogPostLoading() {
  return (
    <main className="min-h-screen flex flex-col bg-zinc-950">
      <Header />

      <div className="flex-1 pt-24 pb-20">
        <div className="container mx-auto px-4">
          <div className="lg:grid lg:grid-cols-[1fr_288px] lg:gap-10 lg:items-start">

            {/* Article skeleton */}
            <div className="max-w-3xl">
              {/* Back link */}
              <Skeleton className="w-32 h-4 mb-8" />

              {/* Title */}
              <Skeleton className="h-9 w-4/5 mb-3" />
              <Skeleton className="h-9 w-3/5 mb-5" />

              {/* Meta */}
              <div className="flex gap-3 mb-8">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>

              {/* Cover image */}
              <Skeleton className="h-72 w-full rounded-xl mb-8" />

              {/* Content paragraphs */}
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className={`h-4 ${i % 3 === 2 ? 'w-4/5' : 'w-full'}`} />
                ))}
              </div>
              <div className="space-y-3 mt-8">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className={`h-4 ${i % 4 === 3 ? 'w-3/5' : 'w-full'}`} />
                ))}
              </div>
              <div className="space-y-3 mt-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className={`h-4 ${i % 5 === 4 ? 'w-2/3' : 'w-full'}`} />
                ))}
              </div>
            </div>

            {/* Sidebar skeleton */}
            <aside className="hidden lg:block">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-zinc-800">
                  <Skeleton className="w-7 h-7 rounded-md" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-2.5 w-8" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                  <Skeleton className="h-3 w-10" />
                </div>
                <div className="py-2 space-y-1">
                  {Array.from({ length: 13 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2">
                      <Skeleton className="w-4 h-3 shrink-0" />
                      <Skeleton className={`h-3 ${i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-4/5' : 'w-3/5'}`} />
                    </div>
                  ))}
                </div>
              </div>
            </aside>

          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
