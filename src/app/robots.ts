import { absoluteSitemapUrl, siteOrigin } from "@/lib/site-url";
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = await siteOrigin();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/"],
    },
    sitemap: await absoluteSitemapUrl(),
    host: origin.host,
  };
}
