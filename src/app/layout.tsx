import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/components/Header/Bahasa";
import NavigationProgress from "@/components/NavigationProgress";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Angga Rakhmansyah — Finance × Tech",
  description: "Finance professional turned developer. 5+ years in finance, now building tech tools that bridge both worlds.",
  keywords: "Angga Rakhmansyah, Portfolio, Web Developer, Finance, Python, JavaScript, IDX, Tax Automation",
  authors: [{ name: "Angga Rakhmansyah" }],
  openGraph: {
    title: "Angga Rakhmansyah — Finance × Tech",
    description: "Finance professional turned developer. 5+ years in finance, now building tech tools.",
    url: "https://unpam.cloud",
    siteName: "Angga Rakhmansyah",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          <LanguageProvider>
            <NavigationProgress />
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
