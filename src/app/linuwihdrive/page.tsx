import type { Metadata } from 'next';
import Link from 'next/link';
import { HardDrive, ShieldCheck, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Linuwih Drive | Angga Rakhmansyah',
  description:
    'Linuwih Drive menyinkronkan folder Google Drive dengan PC Windows dan perangkat Android. / Linuwih Drive syncs Google Drive folders with Windows PCs and Android devices.',
  alternates: { canonical: 'https://anggasyh.my.id/linuwihdrive' },
};

const CONTACT_EMAIL = 'angga@muslim.com';

function Lang({ code, children }: { code: 'ID' | 'EN'; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <span className="inline-block mb-3 text-[11px] font-data tracking-widest text-emerald-500/80">{code}</span>
      <div className="space-y-4 text-zinc-400 leading-relaxed">{children}</div>
    </div>
  );
}

export default function LinuwihDrivePage() {
  return (
    <main className="min-h-screen flex flex-col bg-zinc-950">
      <Header />

      <div className="flex-1 pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <HardDrive size={17} className="text-emerald-500" />
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-semibold text-zinc-100">Linuwih Drive</h1>
            </div>
            <p className="text-zinc-500">
              Sinkron folder Google Drive ↔ PC Windows &amp; Android · Google Drive folder sync for Windows &amp; Android
            </p>
          </div>

          <div className="space-y-6">
            <Lang code="ID">
              <p>
                <strong className="text-zinc-200">Linuwih Drive</strong> adalah aplikasi untuk Windows dan Android
                yang dikembangkan oleh Angga Rakhmansyah (Angga Syah). Aplikasi ini menyinkronkan secara dua arah
                folder Google Drive yang Anda pilih (termasuk folder di Drive bersama) dengan folder di perangkat
                Anda sendiri.
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Anda masuk dengan akun Google dan memilih folder Drive serta folder lokal yang ingin disinkron.</li>
                <li>Berkas baru, berubah, atau terhapus di salah satu sisi diterapkan ke sisi lainnya.</li>
                <li>Tidak ada server milik pengembang; semua proses berjalan di perangkat Anda dan langsung ke Google Drive.</li>
                <li>Versi Windows dapat (opsional) mengirim notifikasi status sinkron ke grup Telegram milik Anda sendiri.</li>
              </ul>
              <p>
                Aplikasi ini memakai akses Google Drive (<code className="font-data text-zinc-300">https://www.googleapis.com/auth/drive</code>)
                hanya untuk menyinkronkan folder yang Anda pilih.
              </p>
            </Lang>

            <Lang code="EN">
              <p>
                <strong className="text-zinc-200">Linuwih Drive</strong> is a Windows and Android app developed by
                Angga Rakhmansyah (Angga Syah). It performs two-way sync between the Google Drive folders you choose
                (including folders in shared drives) and folders on your own device.
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>You sign in with your Google account and pick the Drive folder and local folder to sync.</li>
                <li>Files added, changed, or deleted on one side are applied to the other side.</li>
                <li>There is no developer-owned server; everything runs on your device and talks directly to Google Drive.</li>
                <li>The Windows version can optionally send sync-status notifications to your own Telegram group.</li>
              </ul>
              <p>
                The app uses Google Drive access (<code className="font-data text-zinc-300">https://www.googleapis.com/auth/drive</code>)
                solely to sync the folders you select.
              </p>
            </Lang>

            <Link
              href="/linuwihdrive/privasi"
              className="flex items-center justify-between gap-3 bg-zinc-900 border border-emerald-500/30 rounded-xl p-5 hover:border-emerald-500/60 transition-colors"
            >
              <span className="flex items-center gap-3">
                <ShieldCheck size={18} className="text-emerald-500 shrink-0" />
                <span className="text-zinc-200 font-medium">Kebijakan Privasi · Privacy Policy</span>
              </span>
              <ArrowRight size={16} className="text-emerald-500" />
            </Link>

            <p className="text-sm text-zinc-500">
              Kontak / Contact:{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-emerald-500 hover:text-emerald-400 transition-colors">
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
