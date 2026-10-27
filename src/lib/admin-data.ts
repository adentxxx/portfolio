import {
  parseFaces,
  readCreated,
  readPeriod,
  sectionsToBlocks,
  type EditorBlock,
} from "@/lib/content-format";
import { prisma } from "@/lib/prisma";

export type AdminLink = { label: string; href: string; icon?: string };

export type AdminSettings = {
  introHeadline: string;
  introBio: string;
  introLinks: AdminLink[];
  contactHeadline: string;
  contactSubline: string;
  contactLinks: AdminLink[];
  faces: string[];
};

export type AdminCompany = {
  id: string;
  name: string;
  role: string;
  description: string;
  logoSrc: string;
  startMonth: number | null;
  startYear: number | null;
  endMonth: number | null;
  endYear: number | null;
  ongoing: boolean;
  dateLabel: string;
  bloubShape: string;
  bloubState: string;
  bloubExpression: string | null;
  published: boolean;
  blocks: EditorBlock[];
};

export type AdminProject = {
  id: string;
  slug: string;
  title: string;
  description: string;
  summary: string;
  tags: string[];
  logoSrc: string;
  createdMonth: number | null;
  createdYear: number | null;
  dateLabel: string;
  bloubShape: string;
  bloubState: string;
  bloubExpression: string | null;
  published: boolean;
  blocks: EditorBlock[];
};

function parseLinkList(raw: string): AdminLink[] {
  try {
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value)) return [];
    return value.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const label = (item as { label?: unknown }).label;
      const href = (item as { href?: unknown }).href;
      const icon = (item as { icon?: unknown }).icon;
      if (typeof label !== "string" || typeof href !== "string") return [];
      const link: AdminLink = { label, href };
      if (typeof icon === "string") link.icon = icon;
      return [link];
    });
  } catch {
    return [];
  }
}

function parseTags(raw: string) {
  try {
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value)) return [];
    return value.filter((tag): tag is string => typeof tag === "string");
  } catch {
    return [];
  }
}

export async function getAdminData() {
  const [companies, projects, settings] = await Promise.all([
    prisma.company.findMany({
      orderBy: { order: "asc" },
      include: { blocks: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.project.findMany({
      orderBy: { order: "asc" },
      include: { sections: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.siteSettings.findUnique({ where: { id: "default" } }),
  ]);

  return {
    settings: settings
      ? ({
          introHeadline: settings.introHeadline,
          introBio: settings.introBio,
          introLinks: parseLinkList(settings.introLinksJson),
          contactHeadline: settings.contactHeadline,
          contactSubline: settings.contactSubline,
          contactLinks: parseLinkList(settings.contactLinksJson),
          faces: parseFaces(settings.avatarFacesJson),
        } satisfies AdminSettings)
      : null,
    companies: companies.map((company) => {
      const period = readPeriod(company);
      return {
        id: company.id,
        name: company.name,
        role: company.role,
        description: company.description,
        logoSrc: company.logoSrc,
        startMonth: period.startMonth,
        startYear: period.startYear,
        endMonth: period.endMonth,
        endYear: period.endYear,
        ongoing: period.ongoing,
        dateLabel: company.dateLabel,
        bloubShape: company.bloubShape,
        bloubState: company.bloubState,
        bloubExpression: company.bloubExpression,
        published: company.published,
        blocks: company.blocks
          .filter(
            (block) =>
              block.kind === "heading" ||
              block.kind === "subheading" ||
              block.kind === "paragraph",
          )
          .map((block) => ({
            id: block.id,
            kind: block.kind as EditorBlock["kind"],
            text: block.text,
            imageSrc: null,
          })),
      } satisfies AdminCompany;
    }),
    projects: projects.map((project) => {
      const created = readCreated(
        project.dateLabel,
        project.createdMonth,
        project.createdYear,
      );
      return {
        id: project.id,
        slug: project.slug,
        title: project.title,
        description: project.description,
        summary: project.summary,
        tags: parseTags(project.tags),
        logoSrc: project.logoSrc,
        createdMonth: created.createdMonth,
        createdYear: created.createdYear,
        dateLabel: project.dateLabel,
        bloubShape: project.bloubShape,
        bloubState: project.bloubState,
        bloubExpression: project.bloubExpression,
        published: project.published,
        blocks: sectionsToBlocks(project.sections, project.heroImage),
      } satisfies AdminProject;
    }),
  };
}
