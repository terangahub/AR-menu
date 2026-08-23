import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import localFont from "next/font/local";
import { Fraunces } from "next/font/google";
import { routing } from "@/i18n/routing";
import "./globals.css";

const geistSans = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "../fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});
// Titres — section 13.3 : "une serif contemporaine chaleureuse (Fraunces
// ou Source Serif), pour un ancrage gastronomie premium".
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Vorae",
  description: "Voyez avant de choisir.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <ClerkProvider>
      <html lang={locale} suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased`}
        >
          {/* attribute="data-theme" pour matcher le sélecteur Tailwind
              (`darkMode: ["selector", '[data-theme="dark"]']`) et les
              tokens CSS de globals.css. Préférence système par défaut
              (section 13.4) — la landing marketing (Sprint 4) forcera le
              sombre spécifiquement sur ses routes. */}
          <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
            <NextIntlClientProvider>{children}</NextIntlClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
