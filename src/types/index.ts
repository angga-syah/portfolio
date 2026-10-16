// Language types
export type Language = 'id' | 'en';

// Translation interface for multilingual content
export interface Translation {
  en: string;
  id: string;
}

// Menu item interface
export interface MenuItem {
  id: number;
  title: Translation;
  href: string;
  newTab?: boolean;
}

// Project interface
export interface Project {
  id: number;
  title: Translation;
  description: Translation;
  tech: string[];
  image?: string;
  github?: string;
  demo?: string;
  featured?: boolean;
  category?: string;
}

// Skill interface
export interface Skill {
  name: string;
  level: number;
  color: string;
  category?: string;
}

// Skill category interface
export interface SkillCategory {
  title: Translation;
  skills: Skill[];
}

// Experience/Education interface
export interface Experience {
  id: number;
  type: 'work' | 'education';
  title: Translation;
  company: Translation;
  period: Translation;
  location: Translation;
  description: Translation;
  skills: string[];
  current?: boolean;
}

// Contact info interface
export interface ContactInfo {
  icon: any; // Lucide icon component
  label: string;
  value: string;
  href: string;
}

// Social link interface
export interface SocialLink {
  icon: any; // Lucide icon component
  href: string;
  label: string;
}

// Certificate interface
export interface Certificate {
  id: number;
  name: string;
  issuer: string;
  date: string;
  url?: string;
  image?: string;
}

// Theme type
export type Theme = 'light' | 'dark';

// Component props interfaces
export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export interface SectionProps {
  className?: string;
  children?: React.ReactNode;
}

// Animation variants for Framer Motion
export interface AnimationVariants {
  hidden: {
    opacity: number;
    y?: number;
    x?: number;
    scale?: number;
  };
  visible: {
    opacity: number;
    y?: number;
    x?: number;
    scale?: number;
    transition?: {
      duration?: number;
      delay?: number;
      ease?: string;
    };
  };
}

// Form interfaces
export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export interface FormState {
  isSubmitting: boolean;
  status: 'idle' | 'success' | 'error';
  message?: string;
}

// Navigation interfaces
export interface NavItem {
  name: string;
  href: string;
}

// SEO Meta data interface
export interface MetaData {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  canonical?: string;
}

// Portfolio data interface
export interface PortfolioData {
  personal: {
    name: string;
    title: Translation;
    description: Translation;
    email: string;
    phone: string;
    location: Translation;
    website: string;
    avatar?: string;
  };
  social: SocialLink[];
  skills: SkillCategory[];
  projects: Project[];
  experiences: Experience[];
  certificates: Certificate[];
}

// Component state interfaces
export interface HeaderState {
  isMenuOpen: boolean;
  isScrolled: boolean;
}

export interface ProjectFilters {
  category: string;
  tech: string[];
  featured: boolean;
}

// API Response interfaces (for future use)
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ContactSubmissionResponse {
  success: boolean;
  message: string;
}

// Blog post interface
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  cover_image?: string;
  tags: string[];
  is_published: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
  series?: string;
  series_order?: number;
}

// Admin post editor form state
export interface PostEditorData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  tags: string;
  cover_image: string;
  is_published: boolean;
  series: string;
  series_order: string;
}

// Utility types
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Event handler types
export type ClickHandler = (event: React.MouseEvent<HTMLElement>) => void;
export type ChangeHandler = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
export type SubmitHandler = (event: React.FormEvent<HTMLFormElement>) => void;