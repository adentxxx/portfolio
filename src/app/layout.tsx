import { Providers } from "@/components/providers";
import { GradualBlur } from "@/components/ui/gradual-blur";
import type { Metadata } from "next";
import { Ubuntu_Sans, Vollkorn } from "next/font/google";
import "./globals.css";

// Figma text styles: Vollkorn Regular (titles), Ubuntu Sans Regular/Medium (body/caption).
const vollkorn = Vollkorn({
  variable: "--font-vollkorn",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
});

const ubuntuSans = Ubuntu_Sans({
  variable: "--font-ubuntu-sans",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Portfolio Roadmap (demo)",
  description:
    "Демо-портфолио в метафоре roadmap: компании слева, проекты справа. Контент — placeholder из БД.",
};

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
        <Providers>{children}</Providers>
        <GradualBlur divCount={3} strength={2} height="6rem" />
      </body>
    </html>
  );
}
