"use client";

import { UI, localeFromPath, type Locale } from "@/lib/i18n";
import { usePathname } from "next/navigation";

/**
 * Language of the page, read from its address. Works on the server render of
 * a client component too, so the first paint is already in the right language.
 */
export function useLocale(): Locale {
  return localeFromPath(usePathname());
}

export function useUi() {
  return UI[useLocale()];
}
