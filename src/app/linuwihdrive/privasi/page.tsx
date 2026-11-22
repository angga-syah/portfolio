import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi Linuwih Drive | Privacy Policy',
  description: 'Kebijakan privasi aplikasi Linuwih Drive (Windows & Android). / Privacy policy for the Linuwih Drive app.',
  alternates: { canonical: 'https://anggasyh.my.id/linuwihdrive/privasi' },
};

const CONTACT_EMAIL = 'angga@muslim.com';
const SCOPE = 'https://www.googleapis.com/auth/drive';

const code = 'font-data text-zinc-300 break-all';
const link = 'text-emerald-500 hover:text-emerald-400 transition-colors';

type Section = { title: string; body: React.ReactNode };

const ID: Section[] = [
  {
    title: '1. Tentang aplikasi',
    body: (
      <p>
        Kebijakan ini berlaku untuk aplikasi <strong className="text-zinc-200">Linuwih Drive</strong> versi Windows
        dan Android, yang dikembangkan oleh Angga Rakhmansyah (Angga Syah). Linuwih Drive menyinkronkan folder
        Google Drive pilihan pengguna dengan folder di perangkat pengguna sendiri.
      </p>
    ),
  },
  {
    title: '2. Data Google yang diakses',
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>
          Berkas dan folder Google Drive (nama, isi, metadata seperti waktu ubah dan ukuran) <em>hanya</em> di
          dalam folder yang Anda pilih untuk disinkron, termasuk folder di Drive bersama.
        </li>
        <li>Nama dan alamat email akun Google, hanya untuk menampilkan akun yang sedang masuk di aplikasi.</li>
      </ul>
    ),
  },
  {
    title: '3. Izin (scope) dan alasannya',
    body: (
      <p>
        Aplikasi meminta scope <code className={code}>{SCOPE}</code>. Scope ini diperlukan karena Linuwih Drive
        melakukan sinkron <em>dua arah</em> pada folder yang sudah ada di Drive pengguna (bukan hanya berkas yang
        dibuat aplikasi), termasuk folder di Drive bersama: membaca daftar dan isi berkas, mengunggah berkas baru,
        memperbarui berkas yang berubah, serta menghapus atau memindahkan berkas sesuai perubahan di perangkat.
        Scope yang lebih sempit (mis. <code className={code}>drive.file</code>) tidak dapat mengakses folder yang
        sudah ada maupun Drive bersama.
      </p>
    ),
  },
  {
    title: '4. Cara data digunakan',
    body: (
      <p>
        Data Google hanya digunakan untuk menyinkronkan berkas antara Google Drive Anda dan perangkat Anda sendiri.
        Data tidak digunakan untuk tujuan lain apa pun.
      </p>
    ),
  },
  {
    title: '5. Penyimpanan data',
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Pengembang tidak memiliki atau memakai server; data Anda tidak pernah dikirim ke pengembang.</li>
        <li>Berkas hasil sinkron dan data status sinkron hanya disimpan di perangkat Anda.</li>
        <li>
          Android: aplikasi tidak menyimpan token akses; token diambil dari Google Play services setiap kali
          dibutuhkan.
        </li>
        <li>Windows: token otorisasi disimpan di berkas konfigurasi lokal di perangkat Anda.</li>
      </ul>
    ),
  },
  {
    title: '6. Berbagi data',
    body: (
      <p>
        Data Google pengguna tidak dijual, tidak dibagikan atau dipindahkan ke pihak ketiga, tidak digunakan untuk
        iklan, dan tidak digunakan untuk melatih atau mengembangkan model AI/ML.
      </p>
    ),
  },
  {
    title: '7. Kepatuhan Google API Services User Data Policy',
    body: (
      <p>
        Penggunaan dan pemindahan informasi yang diterima dari Google API oleh Linuwih Drive mematuhi{' '}
        <a href="https://developers.google.com/terms/api-services-user-data-policy" className={link} target="_blank" rel="noopener noreferrer">
          Google API Services User Data Policy
        </a>
        , termasuk persyaratan Limited Use.
      </p>
    ),
  },
  {
    title: '8. Notifikasi Telegram (opsional, Windows)',
    body: (
      <p>
        Jika Anda mengaktifkannya, versi Windows mengirim pesan status sinkron (mis. berhasil/gagal, jumlah berkas)
        ke grup Telegram milik Anda sendiri melalui bot yang Anda atur. Pesan ini tidak berisi isi berkas dan tidak
        dikirim ke pengembang.
      </p>
    ),
  },
  {
    title: '9. Mencabut akses dan menghapus data',
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>
          Cabut akses kapan saja di{' '}
          <a href="https://myaccount.google.com/permissions" className={link} target="_blank" rel="noopener noreferrer">
            myaccount.google.com/permissions
          </a>
          .
        </li>
        <li>
          Hapus data lokal dengan menghapus (uninstall) aplikasi dan menghapus folder lokal hasil sinkron. Karena
          tidak ada server pengembang, tidak ada data lain yang perlu dihapus.
        </li>
      </ul>
    ),
  },
  {
    title: '10. Kontak dan perubahan',
    body: (
      <p>
        Pertanyaan tentang kebijakan ini:{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className={link}>{CONTACT_EMAIL}</a>. Perubahan kebijakan akan
        diumumkan di halaman ini dengan tanggal berlaku yang diperbarui.
      </p>
    ),
  },
];

const EN: Section[] = [
  {
    title: '1. About the app',
    body: (
      <p>
        This policy applies to the <strong className="text-zinc-200">Linuwih Drive</strong> app for Windows and
        Android, developed by Angga Rakhmansyah (Angga Syah). Linuwih Drive syncs Google Drive folders chosen by
        the user with folders on the user&apos;s own device.
      </p>
    ),
  },
  {
    title: '2. Google data accessed',
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>
          Google Drive files and folders (names, content, metadata such as modified time and size) <em>only</em>{' '}
          inside the folders you choose to sync, including folders in shared drives.
        </li>
        <li>Your Google account name and email address, only to show which account is signed in.</li>
      </ul>
    ),
  },
  {
    title: '3. Scope and justification',
    body: (
      <p>
        The app requests the <code className={code}>{SCOPE}</code> scope. It is required because Linuwih Drive
        performs <em>two-way</em> sync on folders that already exist in the user&apos;s Drive (not only files created
        by the app), including shared drives: listing and reading files, uploading new files, updating changed
        files, and deleting or moving files to mirror changes on the device. Narrower scopes (e.g.{' '}
        <code className={code}>drive.file</code>) cannot access existing folders or shared drives.
      </p>
    ),
  },
  {
    title: '4. How data is used',
    body: (
      <p>
        Google user data is used only to sync files between your Google Drive and your own devices. It is not used
        for any other purpose.
      </p>
    ),
  },
  {
    title: '5. Data storage',
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>The developer does not own or operate any server; your data is never sent to the developer.</li>
        <li>Synced files and sync-state data are stored only on your device.</li>
        <li>Android: the app does not store access tokens; tokens are obtained from Google Play services when needed.</li>
        <li>Windows: the authorization token is stored in a local configuration file on your device.</li>
      </ul>
    ),
  },
  {
    title: '6. Data sharing',
    body: (
      <p>
        Google user data is not sold, not shared with or transferred to third parties, not used for advertising,
        and not used to train or develop AI/ML models.
      </p>
    ),
  },
  {
    title: '7. Google API Services User Data Policy',
    body: (
      <p>
        Linuwih Drive&apos;s use and transfer of information received from Google APIs adheres to the{' '}
        <a href="https://developers.google.com/terms/api-services-user-data-policy" className={link} target="_blank" rel="noopener noreferrer">
          Google API Services User Data Policy
        </a>
        , including the Limited Use requirements.
      </p>
    ),
  },
  {
    title: '8. Telegram notifications (optional, Windows)',
    body: (
      <p>
        If you enable it, the Windows version sends sync-status messages (e.g. success/failure, file counts) to your
        own Telegram group through a bot you configure. These messages never contain file content and are
        not sent to the developer.
      </p>
    ),
  },
  {
    title: '9. Revoking access and deleting data',
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>
          Revoke access at any time at{' '}
          <a href="https://myaccount.google.com/permissions" className={link} target="_blank" rel="noopener noreferrer">
            myaccount.google.com/permissions
          </a>
          .
        </li>
        <li>
          Delete local data by uninstalling the app and deleting the local synced folders. Since there is no
          developer server, there is no other data to delete.
        </li>
      </ul>
    ),
  },
  {
    title: '10. Contact and changes',
    body: (
      <p>
        Questions about this policy: <a href={`mailto:${CONTACT_EMAIL}`} className={link}>{CONTACT_EMAIL}</a>.
        Changes will be posted on this page with an updated effective date.
      </p>
    ),
  },
];

function Policy({ lang, heading, effective, sections }: { lang: 'id' | 'en'; heading: string; effective: string; sections: Section[] }) {
  return (
    <section lang={lang} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <span className="inline-block mb-2 text-[11px] font-data tracking-widest text-emerald-500/80">{lang.toUpperCase()}</span>
      <h2 className="font-display text-2xl font-semibold text-zinc-100 mb-1">{heading}</h2>
      <p className="text-sm text-zinc-500 mb-6">{effective}</p>
      <div className="space-y-6">
        {sections.map((s) => (
          <div key={s.title}>
            <h3 className="text-zinc-200 font-semibold mb-2">{s.title}</h3>
            <div className="text-zinc-400 leading-relaxed">{s.body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function LinuwihDrivePrivacyPage() {
  return (
    <main className="min-h-screen flex flex-col bg-zinc-950">
      <Header />

      <div className="flex-1 pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link href="/linuwihdrive" className="inline-flex items-center gap-1.5 text-sm text-emerald-500 hover:text-emerald-400 transition-colors mb-6">
            <ArrowLeft size={14} /> Linuwih Drive
          </Link>

          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <ShieldCheck size={17} className="text-emerald-500" />
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-semibold text-zinc-100">
                Kebijakan Privasi · Privacy Policy
              </h1>
            </div>
            <p className="text-zinc-500">Linuwih Drive (Windows &amp; Android)</p>
          </div>

          <div className="space-y-6">
            <Policy lang="id" heading="Kebijakan Privasi Linuwih Drive" effective="Berlaku sejak 23 November 2026" sections={ID} />
            <Policy lang="en" heading="Linuwih Drive Privacy Policy" effective="Effective date: 23 November 2026" sections={EN} />
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
