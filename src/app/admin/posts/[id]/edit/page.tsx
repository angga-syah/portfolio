import { notFound } from 'next/navigation';
import sql from '@/lib/db';
import PostEditor from '@/components/Blog/PostEditor';

type Props = { params: Promise<{ id: string }> };

async function getPost(id: string) {
  try {
    const [post] = await sql`SELECT * FROM blog_posts WHERE id = ${id}`;
    return post ?? null;
  } catch {
    return null;
  }
}

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();

  return (
    <PostEditor
      initialData={{
        id: String(post.id),
        title: String(post.title),
        slug: String(post.slug),
        content: String(post.content),
        excerpt: post.excerpt ? String(post.excerpt) : '',
        tags: Array.isArray(post.tags) ? post.tags : [],
        cover_image: post.cover_image ? String(post.cover_image) : '',
        is_published: Boolean(post.is_published),
        ...(post.series ? { series: String(post.series) } : {}),
        ...(post.series_order != null ? { series_order: Number(post.series_order) } : {}),
      }}
    />
  );
}
