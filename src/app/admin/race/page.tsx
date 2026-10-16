'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Ban, Trash2, Trophy } from 'lucide-react';

type Entry = { name: string; ms: number };

function formatTime(ms: number) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const c = Math.floor((ms % 1000) / 10);
  return `${m}:${String(s).padStart(2, '0')}.${String(c).padStart(2, '0')}`;
}

export default function AdminRacePage() {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    load(year);
  }, [year]);

  async function load(y: number) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/race?year=${y}`);
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEntries(data.entries);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }

  async function remove(name: string, ban: boolean) {
    const msg = ban
      ? `Hapus "${name}" dan blokir nama ini selamanya?`
      : `Hapus "${name}" dari leaderboard ${year}?`;
    if (!confirm(msg)) return;
    setBusy(name);
    try {
      const res = await fetch('/api/admin/race', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, name, ban }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setEntries((list) => list.filter((e) => e.name !== name));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Gagal menghapus');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <Trophy size={16} className="text-gray-950" />
            </div>
            <div>
              <h1 className="font-display font-semibold text-white leading-none">Leaderboard Balapan</h1>
              <p className="text-xs text-gray-500 mt-0.5">Moderasi nama pemain</p>
            </div>
          </div>
          <Link href="/admin" className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white border border-gray-700 rounded-lg">
            <ArrowLeft size={12} />
            Kembali
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-2 mb-4">
          {[thisYear, thisYear - 1].map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`px-3 py-1.5 rounded-lg text-sm border ${y === year ? 'border-amber-500 text-amber-400' : 'border-gray-700 text-gray-400 hover:text-white'}`}
            >
              {y}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-500">{entries.length} pemain</span>
        </div>

        {loading ? (
          <p className="text-center py-16 text-gray-500">Memuat...</p>
        ) : error ? (
          <p className="text-center py-16 text-red-400">{error}</p>
        ) : entries.length === 0 ? (
          <p className="text-center py-16 text-gray-500">Belum ada waktu untuk {year}.</p>
        ) : (
          <ol className="divide-y divide-gray-800 border border-gray-800 rounded-xl overflow-hidden">
            {entries.map((e, i) => (
              <li key={e.name} className="flex items-center gap-3 px-4 py-2.5 bg-gray-900">
                <span className="w-8 text-right font-data text-gray-500">{i + 1}.</span>
                <span className="flex-1 font-data">{e.name}</span>
                <span className="font-data text-gray-300">{formatTime(e.ms)}</span>
                <button
                  onClick={() => remove(e.name, false)}
                  disabled={busy === e.name}
                  title="Hapus dari leaderboard"
                  className="p-1.5 text-gray-400 hover:text-red-400 disabled:opacity-40"
                >
                  <Trash2 size={15} />
                </button>
                <button
                  onClick={() => remove(e.name, true)}
                  disabled={busy === e.name}
                  title="Hapus & blokir nama"
                  className="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-40"
                >
                  <Ban size={15} />
                </button>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-4 text-xs text-gray-500">
          Hapus = nama hilang dari papan tahun ini (bisa main lagi). Hapus &amp; blokir = nama itu tidak bisa dipakai lagi selamanya.
        </p>
      </div>
    </div>
  );
}
