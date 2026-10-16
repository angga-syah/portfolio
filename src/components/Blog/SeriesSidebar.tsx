'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { BlogPost } from '@/types';

function seriesLabel(slug: string): string {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Strip "Source Code Semesta #N: " prefix
function shortTitle(title: string) {
  const match = title.match(/^Source Code Semesta #\d+:\s*(.+)$/);
  return match ? match[1] : title;
}

interface Props {
  posts: BlogPost[];      // diurutkan by series_order ASC
  currentSlug?: string;  // optional — jika tidak ada, tidak ada highlight/prev/next
}

export default function SeriesSidebar({ posts, currentSlug }: Props) {
  const [open, setOpen] = useState(false);

  const currentIdx = currentSlug ? posts.findIndex(p => p.slug === currentSlug) : -1;
  const prev = currentIdx > 0 ? posts[currentIdx - 1] : null;
  const next = currentIdx >= 0 && currentIdx < posts.length - 1 ? posts[currentIdx + 1] : null;
  const seriesName = posts[0]?.series ? seriesLabel(posts[0].series) : 'Seri';

  const sidebar = (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-zinc-800">
        <div className="w-7 h-7 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
          <BookOpen size={13} className="text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Seri</p>
          <p className="text-sm font-semibold text-zinc-100 truncate">{seriesName}</p>
        </div>
        <span className="text-xs font-data text-zinc-600 shrink-0">{posts.length} post</span>
      </div>

      {/* Post list */}
      <div className="py-1.5 max-h-[480px] overflow-y-auto">
        {posts.map((post, idx) => {
          const isCurrent = !!currentSlug && post.slug === currentSlug;
          return (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className={`flex items-start gap-3 px-4 py-2.5 transition-colors group ${
                isCurrent
                  ? 'bg-emerald-500/8 border-l-2 border-emerald-500'
                  : 'border-l-2 border-transparent hover:bg-zinc-800/50'
              }`}
            >
              <span className={`font-data text-xs shrink-0 mt-0.5 w-5 text-right ${
                isCurrent ? 'text-emerald-400' : 'text-zinc-600 group-hover:text-zinc-400'
              }`}>
                {idx + 1}
              </span>
              <span className={`text-xs leading-relaxed line-clamp-2 ${
                isCurrent ? 'text-emerald-300 font-medium' : 'text-zinc-500 group-hover:text-zinc-300'
              }`}>
                {shortTitle(post.title)}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Prev / Next nav — hanya tampil di halaman post individual */}
      {currentSlug && (prev || next) && (
        <div className="border-t border-zinc-800 grid grid-cols-2 divide-x divide-zinc-800">
          {prev ? (
            <Link
              href={`/blog/${prev.slug}`}
              className="flex items-center gap-1.5 px-3 py-2.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors group"
            >
              <ChevronLeft size={13} className="shrink-0 group-hover:text-emerald-400 transition-colors" />
              <span className="text-xs line-clamp-1">{shortTitle(prev.title)}</span>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link
              href={`/blog/${next.slug}`}
              className="flex items-center justify-end gap-1.5 px-3 py-2.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors group"
            >
              <span className="text-xs line-clamp-1 text-right">{shortTitle(next.title)}</span>
              <ChevronRight size={13} className="shrink-0 group-hover:text-emerald-400 transition-colors" />
            </Link>
          ) : (
            <div />
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop: full sidebar */}
      <div className="hidden lg:block">{sidebar}</div>

      {/* Mobile: accordion */}
      <div className="lg:hidden">
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-medium text-zinc-300 hover:border-zinc-700 transition-colors"
        >
          <span className="flex items-center gap-2">
            <BookOpen size={14} className="text-emerald-400" />
            {seriesName} · {posts.length} post
          </span>
          {open ? <ChevronUp size={15} className="text-zinc-500" /> : <ChevronDown size={15} className="text-zinc-500" />}
        </button>
        {open && <div className="mt-2">{sidebar}</div>}
      </div>
    </>
  );
}
