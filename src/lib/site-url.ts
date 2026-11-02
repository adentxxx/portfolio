import { pagePath } from "@/lib/public-path";
import { headers } from "next/headers";

function firstHeader(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

/** Absolute origin for canonical, sitemap and og:video. */
export async function siteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      return new URL(configured);
    } catch {
      // Fall through to the request host when the env value is not a URL.
    }
  }

  const headerList = await headers();
  const host =
    firstHeader(headerList.get("x-forwarded-host")) ??
    firstHeader(headerList.get("host"));
  if (!host) return new URL("http://127.0.0.1:43123");

  const forwarded = firstHeader(headerList.get("x-forwarded-proto"));
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host);
  const proto =
    forwarded === "http" || forwarded === "https"
      ? forwarded
      : local
        ? "http"
        : "https";
  return new URL(`${proto}://${host}`);
}

export async function metadataBaseUrl() {
  const origin = await siteOrigin();
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return new URL(`${origin.origin}${base || "/"}`);
}

export async function absolutePageUrl(path: string) {
  const origin = await siteOrigin();
  return new URL(pagePath(path), origin).href;
}

export async function absoluteSitemapUrl() {
  const origin = await siteOrigin();
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return new URL(`${base}/sitemap.xml`, origin).href;
}
