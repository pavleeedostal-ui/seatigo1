import type { Metadata } from "next";
import { Archivo, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { buildAlternates, canonicalFor, siteUrl } from "@/lib/seo";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CtaTracker } from "@/components/analytics/CtaTracker";
import "../globals.css";

/**
 * One family for the whole album. Archivo's width axis gives the condensed
 * display capitals and the normal-width UI text from a single file, and
 * latin-ext carries Czech, German, Spanish, Italian and French diacritics.
 */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.home" });

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: t("title"),
      template: "%s",
    },
    description: t("description"),
    alternates: {
      canonical: canonicalFor(locale),
      languages: buildAlternates().languages,
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      siteName: "Seatigo",
      locale,
      type: "website",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${archivo.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper text-ink">
        <NextIntlClientProvider>
          <TooltipProvider delayDuration={150}>
            <CtaTracker />
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </TooltipProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
