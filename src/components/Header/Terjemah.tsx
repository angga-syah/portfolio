"use client";

import React from "react";
import { useLanguage } from "./Bahasa";

const Terjemah: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    const newLang = language === "en" ? "id" : "en";
    setLanguage(newLang);
    localStorage.setItem("language", newLang);
  };

  return (
    <button 
      onClick={toggleLanguage} 
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-200"
    >
      {language === "en" ? (
        <>
          <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="12" fill="#D7141A"/> 
            <rect y="12" width="24" height="12" fill="#FFFFFF"/> 
          </svg>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">ID</span>
        </>
      ) : (
        <>
          <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" fill="#012169"/>
            <path d="M0,0 L24,24 M24,0 L0,24" stroke="white" strokeWidth="4"/>
            <path d="M0,0 L24,24 M24,0 L0,24" stroke="#C8102E" strokeWidth="2"/>
            <rect x="10" width="4" height="24" fill="white"/>
            <rect y="10" width="24" height="4" fill="white"/>
            <rect x="11" width="2" height="24" fill="#C8102E"/>
            <rect y="11" width="24" height="2" fill="#C8102E"/>
          </svg>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">EN</span>
        </>
      )}
    </button>
  );
};

export default Terjemah;