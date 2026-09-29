import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Custom colors for portfolio
        tech: {
          react: "#61dafb",
          nextjs: "#000000",
          typescript: "#3178c6",
          javascript: "#f7df1e",
          html: "#e34f26",
          css: "#1572b6",
          tailwind: "#06b6d4",
          node: "#339933",
          python: "#3776ab",
          git: "#f05032",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Space Grotesk", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "Fira Code", "monospace"],
        data: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.75rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1" }],
        "6xl": ["3.75rem", { lineHeight: "1" }],
        "7xl": ["4.5rem", { lineHeight: "1" }],
        "8xl": ["6rem", { lineHeight: "1" }],
        "9xl": ["8rem", { lineHeight: "1" }],
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "100": "25rem",
        "112": "28rem",
        "128": "32rem",
      },
      screens: {
        "3xl": "1600px",
        "4xl": "1920px",
      },
      maxWidth: {
        "8xl": "88rem",
        "9xl": "96rem",
      },
      animation: {
        "nav-progress": "navProgress 1.2s ease-in-out infinite",
        "fade-in": "fadeIn 0.5s ease-in-out",
        "fade-in-up": "fadeInUp 0.5s ease-out",
        "fade-in-down": "fadeInDown 0.5s ease-out",
        "slide-in-left": "slideInLeft 0.5s ease-out",
        "slide-in-right": "slideInRight 0.5s ease-out",
        "bounce-in": "bounceIn 0.5s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
        "float": "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 3s linear infinite",
        "wiggle": "wiggle 1s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "gradient": "gradient 15s ease infinite",
        "blob": "blob 7s infinite",
        "tilt": "tilt 10s infinite linear",
      },
      keyframes: {
        navProgress: {
          "0%":   { transform: "translateX(-100%)" },
          "50%":  { transform: "translateX(0%)" },
          "100%": { transform: "translateX(100%)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInDown: {
          "0%": { opacity: "0", transform: "translateY(-30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        bounceIn: {
          "0%": { 
            opacity: "0",
            transform: "scale(0.3) translate3d(0, 0, 0)",
          },
          "50%": { 
            opacity: "0.9",
            transform: "scale(1.05)",
          },
          "80%": {
            opacity: "1",
            transform: "scale(0.95)",
          },
          "100%": {
            opacity: "1",
            transform: "scale(1) translate3d(0, 0, 0)",
          },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(59, 130, 246, 0.5)" },
          "100%": { boxShadow: "0 0 20px rgba(59, 130, 246, 0.8)" },
        },
        gradient: {
          "0%, 100%": {
            backgroundSize: "200% 200%",
            backgroundPosition: "left center",
          },
          "50%": {
            backgroundSize: "200% 200%",
            backgroundPosition: "right center",
          },
        },
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        tilt: {
          "0%, 50%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(1deg)" },
          "75%": { transform: "rotate(-1deg)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "grid-pattern": "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%239C92AC\" fill-opacity=\"0.1\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"1\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
      },
      backdropBlur: {
        xs: "2px",
      },
      transitionDuration: {
        "400": "400ms",
        "600": "600ms",
        "800": "800ms",
        "900": "900ms",
      },
      zIndex: {
        "60": "60",
        "70": "70",
        "80": "80",
        "90": "90",
        "100": "100",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries"),
    // Custom plugin for utilities
    function({ addUtilities, addBase }: any) {
      // Add custom base styles
      addBase({
        ":root": {
          "--border": "214.3 31.8% 91.4%",
          "--input": "214.3 31.8% 91.4%",
          "--ring": "222.2 84% 4.9%",
          "--background": "0 0% 100%",
          "--foreground": "222.2 84% 4.9%",
          "--primary": "222.2 47.4% 11.2%",
          "--primary-foreground": "210 40% 98%",
          "--secondary": "210 40% 96%",
          "--secondary-foreground": "222.2 47.4% 11.2%",
          "--muted": "210 40% 96%",
          "--muted-foreground": "215.4 16.3% 46.9%",
          "--accent": "210 40% 96%",
          "--accent-foreground": "222.2 47.4% 11.2%",
          "--destructive": "0 84.2% 60.2%",
          "--destructive-foreground": "210 40% 98%",
          "--popover": "0 0% 100%",
          "--popover-foreground": "222.2 84% 4.9%",
          "--card": "0 0% 100%",
          "--card-foreground": "222.2 84% 4.9%",
          "--radius": "0.5rem",
        },
        ".dark": {
          "--border": "217.2 32.6% 17.5%",
          "--input": "217.2 32.6% 17.5%",
          "--ring": "212.7 26.8% 83.9%",
          "--background": "222.2 84% 4.9%",
          "--foreground": "210 40% 98%",
          "--primary": "210 40% 98%",
          "--primary-foreground": "222.2 47.4% 11.2%",
          "--secondary": "217.2 32.6% 17.5%",
          "--secondary-foreground": "210 40% 98%",
          "--muted": "217.2 32.6% 17.5%",
          "--muted-foreground": "215 20.2% 65.1%",
          "--accent": "217.2 32.6% 17.5%",
          "--accent-foreground": "210 40% 98%",
          "--destructive": "0 62.8% 30.6%",
          "--destructive-foreground": "210 40% 98%",
          "--popover": "222.2 84% 4.9%",
          "--popover-foreground": "210 40% 98%",
          "--card": "222.2 84% 4.9%",
          "--card-foreground": "210 40% 98%",
        },
        "*": {
          "border-color": "hsl(var(--border))",
        },
        "body": {
          "background-color": "hsl(var(--background))",
          "color": "hsl(var(--foreground))",
        },
      });

      // Add custom utilities
      addUtilities({
        ".text-balance": {
          "text-wrap": "balance",
        },
        ".text-gradient": {
          "background": "linear-gradient(to right, #3b82f6, #8b5cf6)",
          "background-clip": "text",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
        },
        ".glass": {
          "background": "rgba(255, 255, 255, 0.1)",
          "backdrop-filter": "blur(10px)",
          "border": "1px solid rgba(255, 255, 255, 0.2)",
        },
        ".dark .glass": {
          "background": "rgba(0, 0, 0, 0.3)",
          "border": "1px solid rgba(255, 255, 255, 0.1)",
        },
      });
    },
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
};

export default config;