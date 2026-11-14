import { ContactCard } from "@/components/portfolio/contact-card";
import { FloatingControls } from "@/components/portfolio/floating-controls";
import { IntroCard } from "@/components/portfolio/intro-card";
import { Roadmap } from "@/components/portfolio/roadmap";
import { getHomeContent } from "@/lib/content";
import { UI, localizePath, type Locale } from "@/lib/i18n";
import { pagePath } from "@/lib/public-path";
import type { Metadata } from "next";

/** Canonical and the pair of language versions for the home page. */
export function homeMetadata(locale: Locale): Metadata {
  return {
    // The English layout sits under the root one, so its default title would
    // pick up the Russian template. An absolute title takes neither.
    title: { absolute: UI[locale].siteTitle },
    alternates: {
      canonical: pagePath(localizePath("/", locale)),
      languages: {
        ru: pagePath("/"),
        en: pagePath(localizePath("/", "en")),
        "x-default": pagePath("/"),
      },
    },
  };
}

/** The home page in one language. `/` and `/en` both render it. */
export async function HomeView({ locale }: { locale: Locale }) {
  const { intro, contact, companies, projects } = await getHomeContent(locale);

  return (
    <main className="min-h-screen bg-surface-page pb-20">
      <IntroCard
        headline={intro.headline}
        bio={intro.bio}
        links={intro.links}
        faces={intro.faces}
      />
      <Roadmap companies={companies} projects={projects} />
      <ContactCard
        headline={contact.headline}
        subline={contact.subline}
        links={contact.links}
      />
      <FloatingControls />
    </main>
  );
}
