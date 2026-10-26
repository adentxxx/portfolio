import type { WorkBlock } from "@/components/portfolio/roadmap-card";
import { parseFaces } from "@/lib/content-format";
import { prisma } from "@/lib/prisma";

export type IntroLink = { label: string; href: string; icon?: string };
export type ContactLink = { label: string; href: string };

export async function getHomeContent() {
  const [settings, companies, projects, emotions] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: "default" } }),
    prisma.company.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
      include: {
        emotion: true,
        blocks: { orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.project.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
      include: { emotion: true },
    }),
    prisma.bloubEmotion.findMany(),
  ]);

  if (!settings) {
    throw new Error("Site settings missing. Run: npm run db:seed");
  }

  return {
    intro: {
      headline: settings.introHeadline,
      bio: settings.introBio,
      avatarSrc: settings.avatarSrc,
      faces: parseFaces(settings.avatarFacesJson),
      links: JSON.parse(settings.introLinksJson) as IntroLink[],
    },
    contact: {
      headline: settings.contactHeadline,
      subline: settings.contactSubline,
      links: JSON.parse(settings.contactLinksJson) as ContactLink[],
    },
    companies: companies.map((c) => ({
      ...c,
      kind: "company" as const,
      blocks: c.blocks.flatMap((block): WorkBlock[] => {
        if (
          block.kind !== "heading" &&
          block.kind !== "subheading" &&
          block.kind !== "paragraph"
        ) {
          return [];
        }
        return [{ id: block.id, kind: block.kind, text: block.text }];
      }),
    })),
    projects: projects.map((p) => ({
      ...p,
      kind: "project" as const,
      tags: JSON.parse(p.tags) as string[],
    })),
    emotions,
  };
}

export async function getProjectBySlug(slug: string) {
  const project = await prisma.project.findFirst({
    where: { slug, published: true },
    include: {
      emotion: true,
      sections: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!project) return null;
  return {
    ...project,
    tags: JSON.parse(project.tags) as string[],
  };
}
