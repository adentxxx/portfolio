import { UI, localizePath, type Locale } from "@/lib/i18n";
import { publicPath } from "@/lib/public-path";
import { metadataBaseUrl } from "@/lib/site-url";
import type { Metadata } from "next";

/**
 * Site-wide metadata in one language. A nested layout replaces `openGraph`
 * and `twitter` as whole objects, so the English layout builds the full set
 * again instead of patching two fields.
 */
export async function siteMetadata(locale: Locale): Promise<Metadata> {
  const ui = UI[locale];
  const metadataBase = await metadataBaseUrl();
  // Social cards play this H.264 loop (1200×630, ~2s).
  const videoUrl = new URL(publicPath("/og/cover.mp4"), metadataBase).href;

  return {
    metadataBase,
    title: {
      default: ui.siteTitle,
      template: `%s – ${ui.siteName}`,
    },
    description: ui.siteDescription,
    robots: { index: true, follow: true },
    openGraph: {
      title: ui.siteTitle,
      description: ui.siteDescription,
      url: localizePath("/", locale),
      locale: ui.ogLocale,
      type: "website",
      videos: [
        {
          url: videoUrl,
          secureUrl: metadataBase.protocol === "https:" ? videoUrl : undefined,
          type: "video/mp4",
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ui.siteTitle,
      description: ui.siteDescription,
    },
  };
}
