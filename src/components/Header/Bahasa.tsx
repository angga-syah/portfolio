"use client";
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

type Language = 'id' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Always start with 'id' — consistent between server and client, no hydration mismatch.
  // After mount we read localStorage (and fall back to env) to set the real preference.
  const [language, setLanguageState] = useState<Language>('id');

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language | null;
    if (saved === 'id' || saved === 'en') {
      setLanguageState(saved);
      return;
    }
    // No saved preference — use env default
    const envLang = process.env.NEXT_PUBLIC_DEFAULT_LANG;
    if (envLang === 'en') setLanguageState('en');
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
