"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";
import { locales, type SupportedLocale } from "@/i18n";

const languageNames: Record<SupportedLocale, string> = {
  en: "English",
  pt: "Português",
  fr: "Français",
  de: "Deutsch",
};

export function LanguageSelector() {
  const locale = useLocale() as SupportedLocale;
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (newLocale: string) => {
    // Remove current locale from pathname
    const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";
    
    // Construct new path with new locale
    const newPath = `/${newLocale}${pathWithoutLocale}`;
    
    router.push(newPath);
    router.refresh();
  };

  return (
    <Select value={locale} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-[140px] h-9">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <SelectValue placeholder="Language" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            {languageNames[loc]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

