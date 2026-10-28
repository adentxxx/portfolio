import type { WorkBlock } from "@/components/portfolio/roadmap-card";
import { parseFaces } from "@/lib/content-format";
import { prisma } from "@/lib/prisma";
import {
  byRank,
  companySortRank,
  projectSortRank,
  rankClock,
} from "@/lib/timeline-order";

export type IntroLink = { label: string; href: string; icon?: string };
export type ContactLink = { label: string; href: string };

function textBlocks(
  blocks: { id: string; kind: string; text: string }[],
): WorkBlock[] {
  return blocks.flatMap((block): WorkBlock[] => {
    if (
      block.kind !== "heading" &&
      block.kind !== "subheading" &&
      block.kind !== "paragraph"
    ) {
      return [];
    }
    return [{ id: block.id, kind: block.kind, text: block.text }];
  });
}

async function readSettings() {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
  });
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
  };
}

export async function getHomeContent() {
  const clock = rankClock(new Date());
  const [chrome, companies, projects, emotions] = await Promise.all([
    readSettings(),
    prisma.company.findMany({
      where: { published: true },
      select: {
        id: true,
        name: true,
        role: true,
        dateLabel: true,
        startMonth: true,
        startYear: true,
        endMonth: true,
        endYear: true,
        ongoing: true,
        manualRank: true,
        order: true,
        description: true,
        logoSrc: true,
        url: true,
        bloubEmotion: true,
        bloubShape: true,
        bloubState: true,
        bloubExpression: true,
        blocks: {
          orderBy: { sortOrder: "asc" },
          select: { id: true, kind: true, text: true },
        },
      },
    }),
    prisma.project.findMany({
      where: { published: true },
      select: {
        id: true,
        slug: true,
        title: true,
        dateLabel: true,
        createdMonth: true,
        createdYear: true,
        order: true,
        description: true,
        tags: true,
        logoSrc: true,
        bloubEmotion: true,
        bloubShape: true,
        bloubState: true,
        bloubExpression: true,
      },
    }),
    prisma.bloubEmotion.findMany({
      select: { id: true, label: true, state: true, expression: true },
    }),
  ]);

  const companyCards = byRank(
    companies.map((company) => ({
      kind: "company" as const,
      id: company.id,
      name: company.name,
      role: company.role,
      dateLabel: company.dateLabel,
      description: company.description,
      logoSrc: company.logoSrc,
      url: company.url,
      bloubEmotion: company.bloubEmotion,
      bloubShape: company.bloubShape,
      bloubState: company.bloubState,
      bloubExpression: company.bloubExpression,
      blocks: textBlocks(company.blocks),
      order: company.order,
      sortRank: companySortRank(company, clock),
      sortTie: company.order,
    })),
    (company) => company.sortRank,
  );

  const projectCards = byRank(
    projects.map((project) => ({
      kind: "project" as const,
      id: project.id,
      slug: project.slug,
      title: project.title,
      dateLabel: project.dateLabel,
      description: project.description,
      tags: JSON.parse(project.tags) as string[],
      logoSrc: project.logoSrc,
      bloubEmotion: project.bloubEmotion,
      bloubShape: project.bloubShape,
      bloubState: project.bloubState,
      bloubExpression: project.bloubExpression,
      order: project.order,
      sortRank: projectSortRank(project),
      sortTie: project.order,
    })),
    (project) => project.sortRank,
  );

  return {
    ...chrome,
    companies: companyCards,
    projects: projectCards,
    emotions,
  };
}

/** Intro chrome plus the previous and next published case. */
export async function getProjectNav(slug: string) {
  const [chrome, projects] = await Promise.all([
    readSettings(),
    prisma.project.findMany({
      where: { published: true },
      select: {
        id: true,
        slug: true,
        order: true,
        dateLabel: true,
        createdMonth: true,
        createdYear: true,
      },
    }),
  ]);
  const ordered = byRank(projects, projectSortRank);
  const index = ordered.findIndex((project) => project.slug === slug);
  return {
    intro: chrome.intro,
    prevSlug: index > 0 ? ordered[index - 1].slug : null,
    nextSlug:
      index >= 0 && index < ordered.length - 1
        ? ordered[index + 1].slug
        : null,
  };
}

export async function getProjectBySlug(slug: string) {
  const project = await prisma.project.findFirst({
    where: { slug, published: true },
    include: {
      sections: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!project) return null;
  return {
    ...project,
    tags: JSON.parse(project.tags) as string[],
  };
}
