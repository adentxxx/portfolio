"use client";

import { useLocale } from "@/hooks/use-locale";
import { SoundProvider } from "@/hooks/use-sound";
import { ThemeProvider } from "@/hooks/use-theme";
import { useEffect, type ReactNode } from "react";

/** <html lang> follows the address when the page changes without a reload. */
function LangSync() {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <SoundProvider>
        <LangSync />
        {children}
      </SoundProvider>
    </ThemeProvider>
  );
}
