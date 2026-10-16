"use client";

import { ArrowUp, Github, Linkedin, Mail, Instagram } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

const Footer = () => {
  const router = useRouter();
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const currentYear = new Date().getFullYear();

  const navLinks = [
    { name: "Home",     href: isHomePage ? "#home"     : "/" },
    { name: "About",    href: isHomePage ? "#about"    : "/#about" },
    { name: "Projects", href: isHomePage ? "#projects" : "/#projects" },
    { name: "Blog",     href: "/blog" },
    { name: "Contact",  href: isHomePage ? "#contact"  : "/#contact" },
  ];

  const socialLinks = [
    { icon: Github,    href: "https://github.com/angga-syah",                              label: "GitHub" },
    { icon: Linkedin,  href: "https://www.linkedin.com/in/angga-rakhmansyah-362463265",    label: "LinkedIn" },
    { icon: Instagram, href: "https://www.instagram.com/al.rakhm/",                        label: "Instagram" },
    { icon: Mail,      href: "mailto:angga@muslim.com",                                    label: "Email" },
  ];

  const handleClick = (href: string) => {
    if (!href.startsWith("#")) { router.push(href); return; }
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="bg-zinc-950 text-zinc-400 border-t border-zinc-800/60">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl">
          <p className="font-display text-2xl font-semibold text-white">
            angga<span className="text-emerald-500">.</span>
          </p>
          <p className="text-sm leading-relaxed mt-3 max-w-md">
            Finance background. IT student. Passionate builder.
          </p>
          <blockquote className="border-l-2 border-emerald-600 pl-4 mt-6 text-sm italic text-zinc-500">
            “In the middle of difficulty lies opportunity”
            <br />
            <cite className="text-xs not-italic text-emerald-500/70">— Albert Einstein</cite>
          </blockquote>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-10">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => handleClick(link.href)}
              className="text-sm text-zinc-400 hover:text-white transition-colors duration-150"
            >
              {link.name}
            </button>
          ))}
          <span className="w-px h-4 bg-zinc-800" />
          {socialLinks.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className="text-zinc-500 hover:text-emerald-400 transition-colors duration-150"
            >
              <s.icon size={16} />
            </a>
          ))}
        </div>
      </div>

      <div className="border-t border-zinc-800/60">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-zinc-600">
          <span>© {currentYear} Angga Rakhmansyah. Built with Next.js · Tailwind CSS · Supabase.</span>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-1.5 hover:text-emerald-400 transition-colors duration-150"
          >
            <ArrowUp size={13} />
            Back to top
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
