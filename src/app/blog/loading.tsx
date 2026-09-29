import Header from '@/components/Header';
import Footer from '@/components/Footer';

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-zinc-800 ${className ?? ''}`} />;
}

export default function BlogLoading() {
  return (
    <main className="min-h-screen flex flex-col bg-zinc-950">
      <Header />

      <div className="flex-1 pt-24 pb-20">
        <div className="container mx-auto px-4">

          {/* Header skeleton */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <Skeleton className="w-12 h-3.5" />
            </div>
            <Skeleton className="w-56 h-8 mb-3" />
            <Skeleton className="w-80 h-4" />
          </div>

          {/* Disclaimer skeleton */}
          <Skeleton className="mb-10 h-12 w-full rounded-lg" />

          {/* Grid skeleton */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-6 bg-zinc-900 rounded-xl border border-zinc-800 space-y-3">
                <Skeleton className="h-44 w-full rounded-lg mb-4" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-3.5 w-16" />
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      <Footer />
    </main>
  );
}
