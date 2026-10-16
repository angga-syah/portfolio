"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useLanguage } from "./Bahasa";
import Terjemah from "./Terjemah";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { language } = useLanguage();
  const pathname = usePathname();

  const navItems = {
    en: [
      { name: "World",  href: "/" },
      { name: "Blog",   href: "/blog" },
      { name: "Resume", href: "/resume" },
    ],
    id: [
      { name: "Dunia", href: "/" },
      { name: "Blog",  href: "/blog" },
      { name: "CV",    href: "/resume" },
    ],
  };

  const currentNav = navItems[language as keyof typeof navItems];

  const logoHref = "/";

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="fixed top-4 left-0 right-0 z-50 px-4"
    >
      <nav
        className="container mx-auto flex items-center justify-between rounded-full
                   px-5 py-2.5 transition-colors duration-300
                   bg-zinc-900/90 backdrop-blur-md border border-zinc-800 shadow-lg shadow-black/20"
      >
        {/* Logo */}
        <Link
          href={logoHref}
          className="text-base font-bold text-emerald-500 tracking-tight hover:opacity-80 transition-opacity font-data"
        >
          angga<span className="text-zinc-600">.</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {currentNav.map((item) => (
            <Link
              key={`${language}-${item.name}`}
              href={item.href}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${
                pathname === item.href
                  ? "text-emerald-400 bg-emerald-500/10"
                  : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Right controls */}
        <div className="hidden md:flex items-center gap-2">
          <Terjemah />
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center gap-2">
          <Terjemah />
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-100
                       hover:bg-zinc-800 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="md:hidden container mx-auto mt-2 rounded-2xl border border-zinc-800
                       bg-zinc-900/95 backdrop-blur-md p-2"
          >
            {currentNav.map((item) => (
              <Link
                key={`${language}-mobile-${item.name}`}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium
                           text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60
                           transition-colors duration-150"
              >
                {item.name}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;
