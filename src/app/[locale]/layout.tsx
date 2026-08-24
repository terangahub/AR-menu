import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import { Space_Grotesk, Inter } from "next/font/google";
import { routing } from "@/i18n/routing";
import "./globals.css";

// Typographie — palette/typo reflect.app mesurée, à la demande du client
// (remplace Fraunces/Geist de la section 13, voir CONTEXT.md). AeonikPro
// (titres, dans le prompt d'origine) est une police payante non
// disponible ici ; le prompt lui-même prévoit Space Grotesk comme
// alternative Google Fonts. Idem pour "Inter V" → Inter.
const heading = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "600"],
});
const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
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
        <body className={`${heading.variable} ${body.variable} font-sans antialiased`}>
          {/* attribute="data-theme" pour matcher le sélecteur Tailwind
              (`darkMode: ["selector", '[data-theme="dark"]']`) et les
              tokens CSS de globals.css. Préférence système par défaut pour
              le dashboard (section 13.4 du cahier) — la landing marketing
              force le sombre localement (voir [locale]/page.tsx), reflect.app
              n'a pas de mode clair. */}
          <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
            <NextIntlClientProvider>{children}</NextIntlClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
