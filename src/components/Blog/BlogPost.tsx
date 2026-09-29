'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import { marked } from 'marked';
import { BlogPost as BlogPostType } from '@/types';

marked.setOptions({ gfm: true, breaks: true });

export default function BlogPost({ post }: { post: BlogPostType }) {
  const htmlContent = useMemo(() => marked(post.content) as string, [post.content]);
  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <article className="max-w-3xl mx-auto">
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-zinc-500 hover:text-emerald-400 transition-colors mb-8 text-sm"
      >
        <ArrowLeft size={16} />
        Kembali ke Blog
      </Link>

      <header className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-zinc-100 mb-4 leading-tight">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-600">
          {formattedDate && (
            <span className="flex items-center gap-1.5 font-data">
              <Calendar size={14} />
              {formattedDate}
            </span>
          )}
          {post.tags?.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 px-2.5 py-0.5 border border-zinc-800 bg-zinc-950 text-zinc-500 rounded text-xs font-data"
            >
              <Tag size={11} />
              {tag}
            </span>
          ))}
        </div>
      </header>

      {post.cover_image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.cover_image}
          alt={post.title}
          className="w-full rounded-xl mb-8 max-h-96 object-cover"
        />
      )}

      <div
        className="prose prose-zinc prose-lg dark:prose-invert max-w-none
          prose-p:text-zinc-400 prose-p:text-justify
          prose-headings:font-bold prose-headings:text-zinc-100
          prose-li:text-zinc-400
          prose-strong:text-zinc-200
          prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline
          prose-code:bg-zinc-800 prose-code:text-emerald-300 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
          prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-xl
          prose-blockquote:border-l-emerald-500 prose-blockquote:text-zinc-500
          prose-img:rounded-xl"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </article>
  );
}
