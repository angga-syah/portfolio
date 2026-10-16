import { PortfolioData } from "@/types";
import { 
  Github, 
  Linkedin, 
  Instagram, 
  Mail
} from "lucide-react";

export const portfolioData: PortfolioData = {
  personal: {
    name: "Angga Rakhmansyah",
    title: {
      en: "Computer Science Student & Web Developer",
      id: "Mahasiswa Teknik Informatika & Web Developer"
    },
    description: {
      en: "I've been working in the finance sector since 2018, but my true passion lies in information technology, particularly web and application development. I enjoy exploring and experimenting with computers, both in terms of hardware and software, constantly seeking to deepen my knowledge and skills.",
      id: "Saya telah bekerja di sektor keuangan sejak 2018, tetapi passion sejati saya terletak pada teknologi informasi, khususnya pengembangan web dan aplikasi. Saya menikmati eksplorasi dan eksperimen dengan komputer, baik dari segi hardware maupun software, selalu berusaha memperdalam pengetahuan dan keterampilan saya."
    },
    email: "angga@muslim.com",
    phone: "+62 899 5754 400",
    location: {
      en: "Depok, West Java, Indonesia",
      id: "Depok, Jawa Barat, Indonesia"
    },
    website: "https://unpam.cloud",
    avatar: "/images/profile.jpg"
  },

  social: [
    {
      icon: Github,
      href: "https://github.com/angga-syah",
      label: "GitHub"
    },
    {
      icon: Linkedin,
      href: "https://www.linkedin.com/in/angga-rakhmansyah-362463265",
      label: "LinkedIn"
    },
    {
      icon: Instagram,
      href: "https://www.instagram.com/al.rakhm/",
      label: "Instagram"
    },
    {
      icon: Mail,
      href: "mailto:angga@muslim.com",
      label: "Email"
    }
  ],

  skills: [
    {
      title: {
        en: "Frontend Development",
        id: "Pengembangan Frontend"
      },
      skills: [
        { name: "HTML", level: 85, color: "bg-orange-500" },
        { name: "CSS", level: 75, color: "bg-blue-500" },
        { name: "JavaScript", level: 80, color: "bg-yellow-500" },
        { name: "TypeScript", level: 70, color: "bg-blue-600" },
        { name: "React", level: 70, color: "bg-cyan-500" },
        { name: "Next.js", level: 65, color: "bg-gray-900" },
        { name: "Tailwind CSS", level: 85, color: "bg-teal-500" },
        { name: "Bootstrap", level: 80, color: "bg-purple-600" }
      ]
    },
    {
      title: {
        en: "Tools & Software",
        id: "Tools & Software"
      },
      skills: [
        { name: "Photoshop", level: 90, color: "bg-blue-600" },
        { name: "Filmora", level: 75, color: "bg-green-500" },
        { name: "Git", level: 70, color: "bg-red-500" },
        { name: "VS Code", level: 85, color: "bg-blue-400" },
        { name: "Figma", level: 60, color: "bg-purple-500" },
        { name: "Node.js", level: 65, color: "bg-green-600" }
      ]
    },
    {
      title: {
        en: "Other Skills",
        id: "Keahlian Lain"
      },
      skills: [
        { name: "Finance", level: 95, color: "bg-green-600" },
        { name: "Project Management", level: 80, color: "bg-indigo-500" },
        { name: "Documentation", level: 85, color: "bg-gray-600" },
        { name: "Problem Solving", level: 90, color: "bg-purple-600" },
        { name: "Team Collaboration", level: 85, color: "bg-blue-500" }
      ]
    }
  ],

  projects: [
    {
      id: 1,
      title: {
        en: "Portfolio Website",
        id: "Website Portfolio"
      },
      description: {
        en: "This website marks my first fully accomplished project. I fully developed this website by using a template from GitHub, made necessary code modifications and utilized AI to generate additional code. For visuals, I created images and icons using AI and edited them in Photoshop.",
        id: "Website ini menandai proyek pertama saya yang sepenuhnya berhasil. Saya mengembangkan website ini dengan menggunakan template dari GitHub, melakukan modifikasi kode yang diperlukan dan memanfaatkan AI untuk menghasilkan kode tambahan. Untuk visual, saya membuat gambar dan ikon menggunakan AI dan mengeditnya di Photoshop."
      },
      tech: ["HTML", "CSS", "JavaScript", "Bootstrap", "Photoshop"],
      github: "https://github.com/angga-syah/site",
      demo: "https://unpam.cloud",
      featured: true,
      category: "web"
    },
    {
      id: 2,
      title: {
        en: "Calculator App",
        id: "Aplikasi Kalkulator"
      },
      description: {
        en: "Interactive calculator with modal popup functionality. Features basic arithmetic operations with keyboard support and responsive design for all device sizes.",
        id: "Kalkulator interaktif dengan fungsi modal popup. Fitur operasi aritmatika dasar dengan dukungan keyboard dan desain responsif untuk semua ukuran perangkat."
      },
      tech: ["HTML", "CSS", "JavaScript", "Modal"],
      demo: "#calculator",
      featured: false,
      category: "web"
    },
    {
      id: 3,
      title: {
        en: "Tetris Game",
        id: "Game Tetris"
      },
      description: {
        en: "Classic Tetris game implementation with modern web technologies. Features score tracking, level progression, responsive controls, and smooth animations.",
        id: "Implementasi game Tetris klasik dengan teknologi web modern. Fitur pelacakan skor, progres level, kontrol responsif, dan animasi yang halus."
      },
      tech: ["HTML", "CSS", "JavaScript", "Canvas API"],
      demo: "https://tetris.unpam.cloud/",
      featured: true,
      category: "game"
    },
    {
      id: 4,
      title: {
        en: "Admin Dashboard Frontend",
        id: "Frontend Dashboard Admin"
      },
      description: {
        en: "Frontend admin dashboard with charts and data visualization. Clean UI design with responsive layout, interactive components, and modern design patterns.",
        id: "Dashboard admin frontend dengan chart dan visualisasi data. Desain UI yang bersih dengan layout responsif, komponen interaktif, dan pola desain modern."
      },
      tech: ["HTML", "CSS", "JavaScript", "Chart.js", "Bootstrap"],
      demo: "https://angga-syah.github.io/demo_uts/",
      github: "https://github.com/angga-syah/demo_uts",
      featured: false,
      category: "web"
    },
    {
      id: 5,
      title: {
        en: "Chart Dashboard",
        id: "Dashboard Chart"
      },
      description: {
        en: "Advanced data visualization dashboard with interactive charts and real-time analytics. Features multiple chart types, filtering options, and responsive design.",
        id: "Dashboard visualisasi data canggih dengan chart interaktif dan analitik real-time. Fitur berbagai jenis chart, opsi filter, dan desain responsif."
      },
      tech: ["HTML", "CSS", "JavaScript", "D3.js", "Chart.js"],
      demo: "https://dashboard.unpam.cloud/",
      featured: true,
      category: "web"
    },
    {
      id: 6,
      title: {
        en: "Group Project 4",
        id: "Projek Kelompok 4"
      },
      description: {
        en: "Collaborative web project developed with team members. Features modern design, responsive layout, team coordination, and collaborative development practices.",
        id: "Projek web kolaboratif yang dikembangkan bersama anggota tim. Fitur desain modern, layout responsif, koordinasi tim, dan praktik pengembangan kolaboratif."
      },
      tech: ["HTML", "CSS", "JavaScript", "Bootstrap", "Git"],
      demo: "https://empat.unpam.tech/",
      featured: false,
      category: "web"
    }
  ],

  experiences: [
    {
      id: 1,
      type: "work",
      title: {
        en: "Finance Staff",
        id: "Staff Keuangan"
      },
      company: {
        en: "Financial Institution",
        id: "Institusi Keuangan"
      },
      period: {
        en: "2018 - Present",
        id: "2018 - Sekarang"
      },
      location: {
        en: "Jakarta, Indonesia",
        id: "Jakarta, Indonesia"
      },
      description: {
        en: "Managing financial operations, budget planning, and financial reporting. Developed expertise in financial analysis, documentation, and regulatory compliance. Led initiatives to improve financial processes and reporting accuracy.",
        id: "Mengelola operasi keuangan, perencanaan anggaran, dan pelaporan keuangan. Mengembangkan keahlian dalam analisis keuangan, dokumentasi, dan kepatuhan regulasi. Memimpin inisiatif untuk meningkatkan proses keuangan dan akurasi pelaporan."
      },
      skills: ["Financial Analysis", "Budget Planning", "Reporting", "Documentation", "Compliance"],
      current: true
    },
    {
      id: 2,
      type: "education",
      title: {
        en: "Bachelor of Computer Science",
        id: "Sarjana Teknik Informatika"
      },
      company: {
        en: "Universitas Pamulang",
        id: "Universitas Pamulang"
      },
      period: {
        en: "2023 - Present",
        id: "2023 - Sekarang"
      },
      location: {
        en: "South Tangerang, Indonesia",
        id: "Tangerang Selatan, Indonesia"
      },
      description: {
        en: "Currently pursuing Bachelor's degree in Computer Science. Focusing on web development, software engineering, computer systems, and modern programming technologies. Actively participating in coding projects and technology communities.",
        id: "Saat ini menempuh gelar Sarjana Teknik Informatika. Fokus pada pengembangan web, rekayasa perangkat lunak, sistem komputer, dan teknologi pemrograman modern. Aktif berpartisipasi dalam proyek coding dan komunitas teknologi."
      },
      skills: ["Programming", "Web Development", "Database", "Software Engineering", "Computer Systems"],
      current: true
    },
    {
      id: 3,
      type: "education",
      title: {
        en: "Vocational High School - Accounting",
        id: "SMK - Akuntansi"
      },
      company: {
        en: "SMK Kartika X-2 Jakarta",
        id: "SMK Kartika X-2 Jakarta"
      },
      period: {
        en: "2014 - 2017",
        id: "2014 - 2017"
      },
      location: {
        en: "Jakarta, Indonesia",
        id: "Jakarta, Indonesia"
      },
      description: {
        en: "Vocational High School specializing in Accounting. Gained foundational knowledge in financial management, business operations, and accounting principles. Developed strong analytical and mathematical skills.",
        id: "Sekolah Menengah Kejuruan jurusan Akuntansi. Memperoleh pengetahuan dasar dalam manajemen keuangan, operasi bisnis, dan prinsip akuntansi. Mengembangkan keterampilan analitis dan matematika yang kuat."
      },
      skills: ["Accounting", "Financial Management", "Business Operations", "Analysis", "Mathematics"],
      current: false
    }
  ],

  certificates: [
    {
      id: 1,
      name: "Introduction to HTML",
      issuer: "Sololearn",
      date: "2024",
      url: "https://www.sololearn.com/certificates/CC-MR9UJVTK",
      image: "https://api2.sololearn.com/v2/certificates/CC-MR9UJVTK/image/jpg?t=638674093996743550"
    },
    {
      id: 2,
      name: "Introduction to CSS",
      issuer: "Sololearn", 
      date: "2024",
      url: "https://www.sololearn.com/certificates/CC-EK1SKGJH",
      image: "https://api2.sololearn.com/v2/certificates/CC-EK1SKGJH/image/jpg?t=638674132889942630"
    },
    {
      id: 3,
      name: "Introduction to JavaScript",
      issuer: "Sololearn",
      date: "2024", 
      url: "https://www.sololearn.com/certificates/CC-T4ITKDSG",
      image: "https://api2.sololearn.com/v2/certificates/CC-T4ITKDSG/image/jpg?t=638674149690735480"
    },
    {
      id: 4,
      name: "JavaScript Intermediate",
      issuer: "Sololearn",
      date: "2024",
      url: "https://www.sololearn.com/certificates/CC-OZLEQXBA", 
      image: "https://api2.sololearn.com/v2/certificates/CC-OZLEQXBA/image/jpg?t=638674859552488400"
    }
  ]
};

export default portfolioData;