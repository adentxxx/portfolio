import { Providers } from "@/components/providers";
import type { Metadata } from "next";
import { Ubuntu_Sans, Vollkorn } from "next/font/google";
import "./globals.css";

const vollkorn = Vollkorn({
  variable: "--font-vollkorn",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
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
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${vollkorn.variable} ${ubuntuSans.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
