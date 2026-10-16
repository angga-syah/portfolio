export type Lang = "en" | "id";
export type L10n = { en: string; id: string };

export const worldContent = {
  name: "ANGGA",
  fullName: "Angga Rakhmansyah",

  about: {
    title: { en: "Finance precision. Developer mindset.", id: "Presisi keuangan. Mindset developer." } satisfies L10n,
    body: {
      en: "5+ years in finance, tax and reporting. Now I write software that automates the boring parts of business: practical, reliable, built around real problems.",
      id: "5+ tahun di keuangan, pajak dan pelaporan. Sekarang saya menulis software yang mengotomasi bagian membosankan dari bisnis: praktis, andal, berangkat dari masalah nyata.",
    } satisfies L10n,
    tags: ["Tax Automation", "Stock Data", "Web Dev", "Data Processing"],
    meta: { en: "Computer Science, Universitas Pamulang  |  Depok, Indonesia", id: "Teknik Informatika, Universitas Pamulang  |  Depok, Indonesia" } satisfies L10n,
  },

  projects: [
    {
      id: "coretax",
      title: { en: "CoretAx Automation", id: "Otomasi CoretAx" },
      description: {
        en: "Auto-downloads documents from CoretAx, the Indonesian DGT tax system. Cuts repetitive manual tax work.",
        id: "Unduh dokumen otomatis dari CoretAx, sistem pajak DJP. Memangkas kerja pajak manual yang berulang.",
      },
      tech: ["JavaScript", "Node.js", "Automation"],
      url: "https://github.com/angga-syah/coretax",
      accent: "#f5b301",
    },
    {
      id: "idx",
      title: { en: "IDX Signal", id: "Sinyal IDX" },
      description: {
        en: "Analyzes Indonesia Stock Exchange data and generates trading signals.",
        id: "Menganalisis data Bursa Efek Indonesia dan menghasilkan sinyal trading.",
      },
      tech: ["Python", "Data Analysis", "Finance"],
      url: "https://github.com/angga-syah/idx-signal",
      accent: "#38bdf8",
    },
    {
      id: "bppu",
      title: { en: "BPPU PDF -> Excel", id: "BPPU PDF -> Excel" },
      description: {
        en: "Extracts BPPU tax withholding PDFs into structured Excel spreadsheets.",
        id: "Mengekstrak PDF bukti potong BPPU menjadi spreadsheet Excel terstruktur.",
      },
      tech: ["Python", "PDF Processing", "Excel"],
      url: "https://github.com/angga-syah/Bukti-Pemotongan-Pemungutan-Unifikasi-bppu-pdf-to-excel-",
      accent: "#10b981",
    },
    {
      id: "vegamshare",
      title: { en: "VegamShare", id: "VegamShare" },
      description: {
        en: "Private file sharing between Android and Windows over local Wi-Fi: no cloud, encrypted, resumable.",
        id: "Berbagi file Android dan Windows lewat Wi-Fi lokal: tanpa internet, terenkripsi, bisa dilanjutkan.",
      },
      tech: ["Rust", "QUIC", "Android"],
      url: "https://github.com/angga-syah/vegamshare",
      accent: "#8b5cf6",
    },
    {
      id: "sembahyang",
      title: { en: "Sembahyang", id: "Sembahyang" },
      description: {
        en: "Offline Android app: prayer times, qibla compass, Qur'an with colour-coded tajwid, zakat & inheritance calculators.",
        id: "Aplikasi Android offline: jadwal sholat, kiblat, Al-Qur'an dengan tajwid berwarna, kalkulator zakat dan waris.",
      },
      tech: ["Kotlin", "Compose", "Android"],
      url: "https://github.com/angga-syah/Sembahyang",
      accent: "#14b8a6",
    },
    {
      id: "ytdl",
      title: { en: "YT Downloader", id: "YT Downloader" },
      description: {
        en: "Local web app for YouTube videos & playlists: bulk rename, format and quality choice, live progress.",
        id: "Web lokal unduh video & playlist YouTube: rename massal, pilih format dan kualitas, progres realtime.",
      },
      tech: ["Python", "Flask", "yt-dlp"],
      url: "https://github.com/angga-syah/Youtube-Playlist-Mix-Download",
      accent: "#ef4444",
    },
    {
      id: "madrasah",
      title: { en: "Madrasah Portal", id: "Portal Madrasah" },
      description: {
        en: "School portal: attendance, grades, printable report cards, career guidance and an alumni tracer study.",
        id: "Portal sekolah: presensi, nilai, rapor siap cetak, bimbingan karier, dan tracer study alumni.",
      },
      tech: ["Next.js", "Supabase", "TypeScript"],
      url: "https://github.com/angga-syah/kp",
      accent: "#6366f1",
    },
  ],

  skills: ["JS", "TS", "PYTHON", "REACT", "NEXT", "NODE", "SQL", "EXCEL", "TAX", "GIT", "CSS", "API"],

  links: [
    { id: "github", label: "GitHub", url: "https://github.com/angga-syah", color: "#3b2340" },
    { id: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/in/angga-rakhmansyah-362463265", color: "#0a66c2" },
    { id: "email", label: "Email", url: "mailto:angga@muslim.com", color: "#f06d5b" },
    { id: "instagram", label: "Instagram", url: "https://www.instagram.com/al.rakhm/", color: "#d6337a" },
  ],

  resumeUrl: "/resume",
  blogUrl: "/blog",

  zones: {
    about: { en: "About me", id: "Tentang saya" },
    projects: { en: "Projects", id: "Projek" },
    skills: { en: "Skills", id: "Keahlian" },
    contact: { en: "Contact", id: "Kontak" },
  } satisfies Record<string, L10n>,
  pads: {
    resume: { en: "Resume", id: "CV" },
    blog: { en: "Blog", id: "Blog" },
    open: { en: "Open", id: "Buka" },
    contact: { en: "Contact", id: "Hubungi" },
  } satisfies Record<string, L10n>,
  skillsBoard: {
    title: { en: "Stack & tools", id: "Stack & tools" },
    body: {
      en: "Knock the crates over. Everything here I use at work: spreadsheets and tax rules by day, code by night.",
      id: "Tabrak saja peti-petinya. Semua ini saya pakai kerja: spreadsheet dan aturan pajak di siang hari, kode di malam hari.",
    },
  } satisfies Record<string, L10n>,
  contactBoard: {
    title: { en: "Let's talk", id: "Yuk ngobrol" },
    body: {
      en: "Park on the pad below and press Enter (or click this board) to send me a message.",
      id: "Parkir di lingkaran di depan lalu tekan Enter (atau klik papan ini) untuk kirim pesan.",
    },
  } satisfies Record<string, L10n>,
  resumeSign: { en: "Download my resume", id: "Lihat CV saya" } satisfies L10n,
  blogSign: { en: "Notes on finance & code", id: "Catatan keuangan & kode" } satisfies L10n,
};

export const t = (v: L10n, lang: Lang) => v[lang] ?? v.en;
