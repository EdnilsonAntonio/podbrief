import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";
import type { Locale } from "next-intl";

// Supported locales
export const locales = ["en", "pt", "fr", "de"] as const;
export type SupportedLocale = (typeof locales)[number];

export const defaultLocale: SupportedLocale = "en";

export default getRequestConfig(async ({ requestLocale }) => {
  // Get locale from request
  const locale = (await requestLocale) as SupportedLocale;
  
  // Validate that the incoming `locale` parameter is valid
  if (!locale || !locales.includes(locale)) {
    notFound();
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});

