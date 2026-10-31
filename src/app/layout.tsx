import { Providers } from "@/components/providers";
import { publicPath } from "@/lib/public-path";
import { themeInitScript } from "@/lib/theme";
import type { Metadata } from "next";
import { Ubuntu_Sans, Vollkorn } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

// Figma text styles: Vollkorn Regular (titles), Ubuntu Sans Regular/Medium (body/caption).
const vollkorn = Vollkorn({
  variable: "--font-vollkorn",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
});

const ubuntuSans = Ubuntu_Sans({
  variable: "--font-ubuntu-sans",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
});

const title = "Portfolio Roadmap (demo)";
const description =
  "Демо-портфолио в метафоре roadmap: компании слева, проекты справа. Контент — placeholder из БД.";

function firstHeader(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

/** Absolute origin for og:video. Crawlers ignore relative video URLs. */
async function siteOrigin() {
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

export async function generateMetadata(): Promise<Metadata> {
  const origin = await siteOrigin();
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const metadataBase = new URL(`${origin.origin}${base || "/"}`);
  // Social cards play this H.264 loop (1200×630, ~2s).
  const videoUrl = new URL(publicPath("/og/cover.mp4"), metadataBase).href;

  return {
    metadataBase,
    title,
    description,
    openGraph: {
      title,
      description,
      url: "/",
      locale: "ru_RU",
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
      title,
      description,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Font variables must live on <html>: globals.css aliases them on :root
    // (--font-display / --font-ui), and var() resolves where it is declared.
    <html
      lang="ru"
      className={`${vollkorn.variable} ${ubuntuSans.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
