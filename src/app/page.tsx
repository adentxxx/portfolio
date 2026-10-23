import { ContactCard } from "@/components/portfolio/contact-card";
import { FloatingControls } from "@/components/portfolio/floating-controls";
import { IntroCard } from "@/components/portfolio/intro-card";
import { Roadmap } from "@/components/portfolio/roadmap";
import { getHomeContent } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { intro, contact, companies, projects, emotions } =
    await getHomeContent();

  return (
    <main className="min-h-screen bg-surface-page pb-20">
      <IntroCard
        headline={intro.headline}
        bio={intro.bio}
        links={intro.links}
        faces={intro.faces}
      />
      <Roadmap
        companies={companies}
        projects={projects}
        emotions={emotions}
      />
      <ContactCard
        headline={contact.headline}
        subline={contact.subline}
        links={contact.links}
      />
      <FloatingControls />
    </main>
  );
}
