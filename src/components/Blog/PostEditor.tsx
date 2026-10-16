'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { marked } from 'marked';
import { ArrowLeft, Eye, Edit2, Save, Send } from 'lucide-react';
import Link from 'next/link';

marked.setOptions({ gfm: true, breaks: true });

interface InitialData {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  tags: string[];
  cover_image: string;
  is_published: boolean;
  series?: string;
  series_order?: number;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function PostEditor({ initialData }: { initialData?: InitialData }) {
  const router = useRouter();
  const isEditing = !!initialData;
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: initialData?.title ?? '',
    slug: initialData?.slug ?? '',
    content: initialData?.content ?? '',
    excerpt: initialData?.excerpt ?? '',
    tags: initialData?.tags?.join(', ') ?? '',
    cover_image: initialData?.cover_image ?? '',
    is_published: initialData?.is_published ?? false,
    series: initialData?.series ?? '',
    series_order: initialData?.series_order?.toString() ?? '',
  });

  const previewHtml = useMemo(() => marked(form.content || '') as string, [form.content]);

  const set = (field: string, value: string | boolean) =>
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'title' && !isEditing) next.slug = slugify(value as string);
      return next;
    });

  const save = async (publish: boolean) => {
    setSaving(true);
    setError('');

    const payload = {
      title: form.title,
      slug: form.slug,
      content: form.content,
      excerpt: form.excerpt || null,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      cover_image: form.cover_image || null,
      is_published: publish,
      series: form.series.trim() || null,
      series_order: form.series_order ? parseInt(form.series_order, 10) : null,
    };

    try {
      const url = isEditing
        ? `/api/admin/posts/${initialData!.id}`
        : '/api/admin/posts';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Gagal menyimpan');
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch {
      setError('Terjadi kesalahan koneksi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft size={16} />
              Admin
            </Link>
            <span className="text-gray-600">/</span>
            <h1 className="text-xl font-bold">
              {isEditing ? 'Edit Postingan' : 'Postingan Baru'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
            >
              {showPreview ? <Edit2 size={14} /> : <Eye size={14} />}
              {showPreview ? 'Editor' : 'Preview'}
            </button>
            <button
              type="button"
              onClick={() => save(false)}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              <Save size={14} />
              Draft
            </button>
            <button
              type="button"
              onClick={() => save(true)}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Send size={14} />
              {saving ? 'Menyimpan...' : isEditing ? 'Perbarui' : 'Terbitkan'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/40 border border-red-700/50 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Meta fields */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">
              JUDUL <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Judul postingan"
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:border-emerald-500 focus:outline-none transition-colors text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">
              SLUG <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => set('slug', e.target.value)}
              placeholder="url-postingan"
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:border-emerald-500 focus:outline-none transition-colors font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">
              TAGS (pisahkan dengan koma)
            </label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => set('tags', e.target.value)}
              placeholder="nextjs, react, web-dev"
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:border-emerald-500 focus:outline-none transition-colors text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">
              URL GAMBAR COVER
            </label>
            <input
              type="url"
              value={form.cover_image}
              onChange={(e) => set('cover_image', e.target.value)}
              placeholder="https://example.com/gambar.jpg"
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:border-emerald-500 focus:outline-none transition-colors text-sm"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs text-gray-400 mb-1.5 font-medium">RINGKASAN</label>
          <textarea
            value={form.excerpt}
            onChange={(e) => set('excerpt', e.target.value)}
            placeholder="Ringkasan singkat yang tampil di daftar blog..."
            rows={2}
            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:border-emerald-500 focus:outline-none transition-colors text-sm resize-none"
          />
        </div>

        {/* Series */}
        <div className="grid grid-cols-[1fr_120px] gap-4 mb-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">
              NAMA SERI <span className="text-gray-600">(opsional)</span>
            </label>
            <input
              type="text"
              value={form.series}
              onChange={(e) => set('series', e.target.value)}
              placeholder="source-code-semesta"
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:border-emerald-500 focus:outline-none transition-colors font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">URUTAN</label>
            <input
              type="number"
              min={1}
              value={form.series_order}
              onChange={(e) => set('series_order', e.target.value)}
              placeholder="1"
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:border-emerald-500 focus:outline-none transition-colors text-sm"
            />
          </div>
        </div>

        {/* Content editor / preview */}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5 font-medium">
            KONTEN (MARKDOWN) <span className="text-red-400">*</span>
          </label>
          {showPreview ? (
            <div className="min-h-96 p-6 bg-gray-800 border border-gray-700 rounded-lg">
              {form.content ? (
                <div
                  className="prose prose-invert prose-sm max-w-none
                    prose-headings:text-white prose-a:text-emerald-400
                    prose-code:bg-gray-700 prose-code:px-1 prose-code:rounded
                    prose-pre:bg-gray-900 prose-blockquote:border-emerald-500"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              ) : (
                <p className="text-gray-500 italic text-sm">Belum ada konten untuk di-preview...</p>
              )}
            </div>
          ) : (
            <textarea
              value={form.content}
              onChange={(e) => set('content', e.target.value)}
              placeholder={`# Judul Artikel\n\nTulis konten markdown di sini...\n\n## Sub-judul\n\nParagraf pertama.\n\n\`\`\`javascript\nconst hello = "world";\n\`\`\``}
              rows={28}
              className="w-full px-3 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-emerald-500 focus:outline-none transition-colors font-mono text-sm resize-y leading-relaxed"
            />
          )}
        </div>
      </div>
    </div>
  );
}
