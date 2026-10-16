"use client";

import { motion } from "framer-motion";
import { Calendar, MapPin, Briefcase, GraduationCap } from "lucide-react";
import { useLanguage } from "../Header/Bahasa";

const Experience = () => {
  const { language } = useLanguage();

  const content = {
    en: {
      title: "Experience & Education",
      subtitle: "My journey so far",
      experienceTab: "Experience",
      educationTab: "Education",
    },
    id: {
      title: "Pengalaman & Pendidikan",
      subtitle: "Perjalanan saya sejauh ini",
      experienceTab: "Pengalaman",
      educationTab: "Pendidikan",
    },
  };

  const t = content[language as keyof typeof content];

  const experiences = [
    {
      id: 1,
      type: "work",
      title: { en: "Finance Staff", id: "Staff Keuangan" },
      company: { en: "Financial Institution", id: "Institusi Keuangan" },
      period: { en: "2018 - Present", id: "2018 - Sekarang" },
      location: { en: "Jakarta, Indonesia", id: "Jakarta, Indonesia" },
      description: {
        en: "Managing financial operations, budget planning, and financial reporting. Developed expertise in financial analysis and documentation.",
        id: "Mengelola operasi keuangan, perencanaan anggaran, dan pelaporan keuangan. Mengembangkan keahlian dalam analisis keuangan dan dokumentasi."
      },
      skills: ["Financial Analysis", "Budget Planning", "Reporting", "Documentation"],
    },
    {
      id: 2,
      type: "education",
      title: { en: "Computer Science", id: "Teknik Informatika" },
      company: { en: "Universitas Pamulang", id: "Universitas Pamulang" },
      period: { en: "2023 - Present", id: "2023 - Sekarang" },
      location: { en: "South Tangerang, Indonesia", id: "Tangerang Selatan, Indonesia" },
      description: {
        en: "Currently pursuing Bachelor's degree in Computer Science. Focusing on web development, software engineering, and computer systems.",
        id: "Saat ini menempuh gelar Sarjana Teknik Informatika. Fokus pada pengembangan web, rekayasa perangkat lunak, dan sistem komputer."
      },
      skills: ["Programming", "Web Development", "Database", "Software Engineering"],
    },
    {
      id: 3,
      type: "education",
      title: { en: "Accounting", id: "Akuntansi" },
      company: { en: "SMK Kartika X-2 Jakarta", id: "SMK Kartika X-2 Jakarta" },
      period: { en: "2014 - 2017", id: "2014 - 2017" },
      location: { en: "Jakarta, Indonesia", id: "Jakarta, Indonesia" },
      description: {
        en: "Vocational High School specializing in Accounting. Gained foundational knowledge in financial management and business operations.",
        id: "Sekolah Menengah Kejuruan jurusan Akuntansi. Memperoleh pengetahuan dasar dalam manajemen keuangan dan operasi bisnis."
      },
      skills: ["Accounting", "Financial Management", "Business Operations"],
    },
  ];

  const workExperiences = experiences.filter(exp => exp.type === "work");
  const educationExperiences = experiences.filter(exp => exp.type === "education");

  const TimelineItem = ({ item, index }: { item: any; index: number }) => (
    <motion.div
      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: index * 0.2 }}
      viewport={{ once: true }}
      className="relative"
    >
      <div className="flex items-center mb-4">
        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          {item.type === "work" ? (
            <Briefcase size={20} className="text-white" />
          ) : (
            <GraduationCap size={20} className="text-white" />
          )}
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {item.title[language as keyof typeof item.title]}
          </h3>
          <p className="text-blue-600 dark:text-blue-400 font-medium">
            {item.company[language as keyof typeof item.company]}
          </p>
        </div>
      </div>

      <div className="ml-16 card">
        <div className="flex flex-col sm:flex-row sm:items-center mb-3 space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <Calendar size={16} className="mr-2" />
            <span className="text-sm">{item.period[language as keyof typeof item.period]}</span>
          </div>
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <MapPin size={16} className="mr-2" />
            <span className="text-sm">{item.location[language as keyof typeof item.location]}</span>
          </div>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
          {item.description[language as keyof typeof item.description]}
        </p>

        <div className="flex flex-wrap gap-2">
          {item.skills.map((skill: string) => (
            <span
              key={skill}
              className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-medium"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );

  return (
    <section id="experience" className="section-padding">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t.title}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {t.subtitle}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Work Experience */}
          <div>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center"
            >
              <Briefcase size={24} className="mr-3 text-blue-600" />
              {t.experienceTab}
            </motion.h3>
            <div className="space-y-8">
              {workExperiences.map((exp, index) => (
                <TimelineItem key={exp.id} item={exp} index={index} />
              ))}
            </div>
          </div>

          {/* Education */}
          <div>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center"
            >
              <GraduationCap size={24} className="mr-3 text-purple-600" />
              {t.educationTab}
            </motion.h3>
            <div className="space-y-8">
              {educationExperiences.map((exp, index) => (
                <TimelineItem key={exp.id} item={exp} index={index} />
              ))}
            </div>
          </div>
        </div>

        {/* Achievement Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {[
            { 
              number: "5+", 
              label: { en: "Years in Finance", id: "Tahun di Keuangan" } 
            },
            { 
              number: "2+", 
              label: { en: "Years Coding", id: "Tahun Coding" } 
            },
            { 
              number: "10+", 
              label: { en: "Projects Completed", id: "Projek Selesai" } 
            },
            { 
              number: "4", 
              label: { en: "Certifications", id: "Sertifikat" } 
            },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold text-gradient mb-2">
                {stat.number}
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                {stat.label[language as keyof typeof stat.label]}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Experience;