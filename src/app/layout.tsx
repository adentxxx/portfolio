import { GoogleAnalytics } from "@/components/google-analytics";
import { Providers } from "@/components/providers";
import { publicPath } from "@/lib/public-path";
import { metadataBaseUrl } from "@/lib/site-url";
import { themeInitScript } from "@/lib/theme";
import type { Metadata } from "next";
import { Ubuntu_Sans, Vollkorn } from "next/font/google";
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

const title = "Александр Проскуренко – быстро, дорого, аху...";
const description =
  "Портфолио продуктового дизайнера. Проекты для B2B, B2C и мобильных продуктов: как устроены экраны и почему они такие.";

export async function generateMetadata(): Promise<Metadata> {
  const metadataBase = await metadataBaseUrl();
  // Social cards play this H.264 loop (1200×630, ~2s).
  const videoUrl = new URL(publicPath("/og/cover.mp4"), metadataBase).href;

  return {
    metadataBase,
    title: {
      default: title,
      template: "%s – Александр Проскуренко",
    },
    description,
    robots: { index: true, follow: true },
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
        <GoogleAnalytics />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
