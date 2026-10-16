'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, ShieldAlert } from 'lucide-react';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (blocked) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/admin');
        router.refresh();
        return;
      }

      const data = await res.json();

      if (res.status === 429) {
        setBlocked(true);
        setError(data.error);
        setPassword('');
        return;
      }

      if (typeof data.attemptsRemaining === 'number') {
        setAttemptsLeft(data.attemptsRemaining);
        setError(
          data.attemptsRemaining > 0
            ? `Password salah. Sisa ${data.attemptsRemaining} percobaan.`
            : 'Password salah. Ini percobaan terakhir.'
        );
      } else {
        setError('Password salah.');
      }

      setPassword('');
    } catch {
      setError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">

          <div className="text-center mb-8">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4
              ${blocked ? 'bg-red-500/10 border border-red-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
              {blocked
                ? <ShieldAlert size={24} className="text-red-400" />
                : <Lock size={24} className="text-emerald-400" />
              }
            </div>
            <h1 className="font-display text-xl font-semibold text-zinc-100">Admin Panel</h1>
            <p className="text-zinc-600 mt-1 text-sm font-data">angga.portfolio</p>
          </div>

          {blocked ? (
            <div className="text-center py-4 space-y-2">
              <p className="text-red-400 text-sm">{error}</p>
              <p className="text-zinc-600 text-xs font-data">IP Anda diblokir sementara</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 pr-11 bg-zinc-950 border border-zinc-800 rounded-lg
                             text-zinc-100 placeholder-zinc-700 text-sm
                             focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500
                             outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {error && (
                <p className={`text-xs text-center py-2 px-3 rounded-lg border font-data
                  ${attemptsLeft === 0
                    ? 'text-red-400 bg-red-900/20 border-red-800/30'
                    : 'text-amber-400 bg-amber-900/20 border-amber-800/30'
                  }`}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !password}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white
                           font-medium rounded-lg transition-colors
                           disabled:opacity-40 disabled:cursor-not-allowed text-sm"
              >
                {loading ? 'Masuk...' : 'Masuk'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-zinc-700 text-xs mt-5 font-data">
          Max 5 percobaan per 15 menit
        </p>
      </div>
    </div>
  );
}
