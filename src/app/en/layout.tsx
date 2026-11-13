import { siteMetadata } from "@/lib/site-meta";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return siteMetadata("en");
}

/**
 * English pages share the root layout, whose <html lang> is Russian. This
 * script runs while the page is parsed and corrects it before anything reads
 * it; `LangSync` in the providers keeps it right on in-app navigation.
 */
export default function EnglishLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: 'document.documentElement.lang="en"',
        }}
      />
      {children}
    </>
  );
}
