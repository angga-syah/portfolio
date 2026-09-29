'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, Eye, LogOut, BookOpen } from 'lucide-react';
import { BlogPost } from '@/types';

export default function AdminPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/posts');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      setPosts(data);
    } catch {
      console.error('Gagal memuat postingan');
    } finally {
      setLoading(false);
    }
  }

  async function deletePost(id: string, title: string) {
    if (!confirm(`Hapus "${title}"?\n\nTindakan ini tidak bisa dibatalkan.`)) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' });
      setPosts((p) => p.filter((post) => post.id !== id));
    } catch {
      alert('Gagal menghapus postingan');
    } finally {
      setDeleting(null);
    }
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  const published = posts.filter((p) => p.is_published).length;
  const drafts = posts.filter((p) => !p.is_published).length;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header bar */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <BookOpen size={16} className="text-white" />
            </div>
            <div>
              <h1 className="font-display font-semibold text-white leading-none">Admin Panel</h1>
              <p className="text-xs text-gray-500 mt-0.5">Angga Rakhmansyah Portfolio</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/" target="_blank" className="px-3 py-1.5 text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg transition-colors">
              Lihat Portfolio
            </Link>
            <Link href="/blog" target="_blank" className="px-3 py-1.5 text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg transition-colors">
              Lihat Blog
            </Link>
            <Link href="/admin/race" className="px-3 py-1.5 text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg transition-colors">
              Leaderboard
            </Link>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-red-400 border border-gray-700 hover:border-red-800 rounded-lg transition-colors"
            >
              <LogOut size={12} />
              Keluar
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8 max-w-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{posts.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{published}</p>
            <p className="text-xs text-gray-500 mt-1">Terbit</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{drafts}</p>
            <p className="text-xs text-gray-500 mt-1">Draft</p>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-200">Semua Postingan</h2>
          <Link
            href="/admin/posts/new"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors text-sm font-medium"
          >
            <Plus size={16} />
            Postingan Baru
          </Link>
        </div>

        {/* Post list */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">Memuat...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-3">Belum ada postingan</p>
            <Link href="/admin/posts/new" className="text-emerald-400 hover:underline text-sm">
              Buat postingan pertama
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {posts.map((post) => (
              <div
                key={post.id}
                className="flex items-center gap-4 p-4 bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl transition-colors"
              >
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    post.is_published ? 'bg-green-400' : 'bg-yellow-400'
                  }`}
                  title={post.is_published ? 'Diterbitkan' : 'Draft'}
                />

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white truncate">{post.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    <span className={post.is_published ? 'text-green-500' : 'text-yellow-500'}>
                      {post.is_published ? 'Diterbitkan' : 'Draft'}
                    </span>
                    {' · '}
                    {new Date(post.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                    {post.tags?.length > 0 && ` · ${post.tags.slice(0, 2).join(', ')}`}
                  </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {post.is_published && (
                    <Link
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      className="p-2 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
                      title="Lihat postingan"
                    >
                      <Eye size={15} />
                    </Link>
                  )}
                  <Link
                    href={`/admin/posts/${post.id}/edit`}
                    className="p-2 text-gray-500 hover:text-emerald-400 transition-colors rounded-lg hover:bg-gray-800"
                    title="Edit"
                  >
                    <Edit2 size={15} />
                  </Link>
                  <button
                    onClick={() => deletePost(post.id, post.title)}
                    disabled={deleting === post.id}
                    className="p-2 text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-gray-800 disabled:opacity-40"
                    title="Hapus"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
