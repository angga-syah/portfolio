import Link from 'next/link';
import { Calendar, Tag } from 'lucide-react';
import { BlogPost } from '@/types';

export default function BlogCard({ post }: { post: BlogPost }) {
  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <Link href={`/blog/${post.slug}`}>
      <article className="group h-full flex flex-col p-6 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-emerald-500/30 transition-colors duration-200 cursor-pointer">
        {post.cover_image && (
          <div className="mb-4 overflow-hidden rounded-lg flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        <h2 className="text-lg font-semibold text-zinc-100 mb-2 group-hover:text-emerald-400 transition-colors line-clamp-2">
          {post.title}
        </h2>

        {post.excerpt && (
          <p className="text-zinc-500 mb-4 line-clamp-3 flex-1 text-sm leading-relaxed">
            {post.excerpt}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-auto text-xs text-zinc-600">
          {formattedDate && (
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {formattedDate}
            </span>
          )}
          {post.tags?.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 px-2 py-0.5 border border-zinc-800 bg-zinc-950 text-zinc-500 rounded font-data"
            >
              <Tag size={10} />
              {tag}
            </span>
          ))}
        </div>
      </article>
    </Link>
  );
}
