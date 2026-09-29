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
