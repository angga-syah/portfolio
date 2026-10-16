"use client";

import { motion } from "framer-motion";
import { useLanguage } from "../Header/Bahasa";

const Skills = () => {
  const { language } = useLanguage();

  const content = {
    en: {
      title: "Skills & Technologies",
      subtitle: "Technologies I work with",
    },
    id: {
      title: "Keahlian & Teknologi",
      subtitle: "Teknologi yang saya kuasai",
    },
  };

  const t = content[language as keyof typeof content];

  const skillCategories = [
    {
      title: { en: "Frontend", id: "Frontend" },
      skills: [
        { name: "HTML", level: 85, color: "bg-orange-500" },
        { name: "CSS", level: 75, color: "bg-blue-500" },
        { name: "JavaScript", level: 80, color: "bg-yellow-500" },
        { name: "React", level: 70, color: "bg-cyan-500" },
        { name: "Next.js", level: 65, color: "bg-gray-900" },
        { name: "Tailwind CSS", level: 85, color: "bg-cyan-500" },
      ],
    },
    {
      title: { en: "Tools & Software", id: "Tools & Software" },
      skills: [
        { name: "Photoshop", level: 90, color: "bg-blue-600" },
        { name: "Filmora", level: 75, color: "bg-green-500" },
        { name: "Git", level: 70, color: "bg-red-500" },
        { name: "VS Code", level: 85, color: "bg-blue-400" },
        { name: "Figma", level: 60, color: "bg-purple-500" },
      ],
    },
    {
      title: { en: "Other Skills", id: "Keahlian Lain" },
      skills: [
        { name: "Finance", level: 95, color: "bg-green-600" },
        { name: "Project Management", level: 80, color: "bg-indigo-500" },
        { name: "Documentation", level: 85, color: "bg-gray-600" },
        { name: "Problem Solving", level: 90, color: "bg-purple-600" },
      ],
    },
  ];

  return (
    <section id="skills" className="section-padding">
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {skillCategories.map((category, categoryIndex) => (
            <motion.div
              key={category.title.en}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: categoryIndex * 0.2 }}
              viewport={{ once: true }}
              className="card"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                {category.title[language as keyof typeof category.title]}
              </h3>
              <div className="space-y-4">
                {category.skills.map((skill, skillIndex) => (
                  <motion.div
                    key={skill.name}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ 
                      duration: 0.6, 
                      delay: categoryIndex * 0.2 + skillIndex * 0.1 
                    }}
                    viewport={{ once: true }}
                    className="space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {skill.name}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {skill.level}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${skill.level}%` }}
                        transition={{ 
                          duration: 1, 
                          delay: categoryIndex * 0.2 + skillIndex * 0.1 + 0.3,
                          ease: "easeOut"
                        }}
                        viewport={{ once: true }}
                        className={`h-full rounded-full ${skill.color}`}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Certificates Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            {language === "en" ? "Certifications" : "Sertifikat"}
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              "Introduction to HTML",
              "Introduction to CSS", 
              "Introduction to JavaScript",
              "JavaScript Intermediate"
            ].map((cert, index) => (
              <motion.div
                key={cert}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-4 text-white text-center shadow-lg"
              >
                <div className="text-3xl mb-2">🏆</div>
                <h4 className="font-semibold text-sm">{cert}</h4>
                <p className="text-xs opacity-80 mt-1">Sololearn</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Skills;