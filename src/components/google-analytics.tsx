"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef } from "react";

const GA_MEASUREMENT_ID = "G-VD3JRJ2CSW";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function isPrivatePath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

/**
 * Google tag. The first page view comes from gtag config.
 * Later App Router navigations send their own page view.
 */
export function GoogleAnalytics() {
  const pathname = usePathname();
  const skip = isPrivatePath(pathname);
  const seen = useRef<string | null>(null);

  useEffect(() => {
    if (skip) return;
    if (seen.current === pathname) return;
    const first = seen.current === null;
    seen.current = pathname;
    if (first) return;
    window.gtag?.("config", GA_MEASUREMENT_ID, { page_path: pathname });
  }, [pathname, skip]);

  if (skip) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`}
      </Script>
    </>
  );
}
