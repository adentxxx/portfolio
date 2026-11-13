import {
  parseFaces,
  readCreated,
  readPeriod,
  sectionsToBlocks,
  type EditorBlock,
} from "@/lib/content-format";
import { prisma } from "@/lib/prisma";

export type AdminLink = {
  label: string;
  href: string;
  icon?: string;
  /** English label and address. Empty or missing falls back to the two above. */
  labelEn?: string;
  hrefEn?: string;
};

export type AdminSettings = {
  introHeadline: string;
  introHeadlineEn: string;
  introBio: string;
  introBioEn: string;
  introLinks: AdminLink[];
  contactHeadline: string;
  contactHeadlineEn: string;
  contactSubline: string;
  contactSublineEn: string;
  contactLinks: AdminLink[];
  faces: string[];
};

export type AdminCompany = {
  id: string;
  name: string;
  nameEn: string;
  role: string;
  roleEn: string;
  description: string;
  descriptionEn: string;
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
  order: number;
  /** Drag position. Null follows the work period. */
  manualRank: number | null;
  blocks: EditorBlock[];
};

export type AdminProject = {
  id: string;
  slug: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  summary: string;
  summaryEn: string;
  tags: string[];
  logoSrc: string;
  createdMonth: number | null;
  createdYear: number | null;
  dateLabel: string;
  bloubShape: string;
  bloubState: string;
  bloubExpression: string | null;
  published: boolean;
  nda: boolean;
  ndaTitle: string;
  ndaTitleEn: string;
  ndaText: string;
  ndaTextEn: string;
  order: number;
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
      const labelEn = (item as { labelEn?: unknown }).labelEn;
      const hrefEn = (item as { hrefEn?: unknown }).hrefEn;
      if (typeof labelEn === "string" && labelEn) link.labelEn = labelEn;
      if (typeof hrefEn === "string" && hrefEn) link.hrefEn = hrefEn;
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
      include: { blocks: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.project.findMany({
      include: { sections: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.siteSettings.findUnique({ where: { id: "default" } }),
  ]);

  return {
    settings: settings
      ? ({
          introHeadline: settings.introHeadline,
          introHeadlineEn: settings.introHeadlineEn,
          introBio: settings.introBio,
          introBioEn: settings.introBioEn,
          introLinks: parseLinkList(settings.introLinksJson),
          contactHeadline: settings.contactHeadline,
          contactHeadlineEn: settings.contactHeadlineEn,
          contactSubline: settings.contactSubline,
          contactSublineEn: settings.contactSublineEn,
          contactLinks: parseLinkList(settings.contactLinksJson),
          faces: parseFaces(settings.avatarFacesJson),
        } satisfies AdminSettings)
      : null,
    companies: companies.map((company) => {
      const period = readPeriod(company);
      return {
        id: company.id,
        name: company.name,
        nameEn: company.nameEn,
        role: company.role,
        roleEn: company.roleEn,
        description: company.description,
        descriptionEn: company.descriptionEn,
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
        order: company.order,
        manualRank: company.manualRank,
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
            textEn: block.textEn,
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
        titleEn: project.titleEn,
        description: project.description,
        descriptionEn: project.descriptionEn,
        summary: project.summary,
        summaryEn: project.summaryEn,
        tags: parseTags(project.tags),
        logoSrc: project.logoSrc,
        createdMonth: created.createdMonth,
        createdYear: created.createdYear,
        dateLabel: project.dateLabel,
        bloubShape: project.bloubShape,
        bloubState: project.bloubState,
        bloubExpression: project.bloubExpression,
        published: project.published,
        nda: project.nda,
        ndaTitle: project.ndaTitle,
        ndaTitleEn: project.ndaTitleEn,
        ndaText: project.ndaText,
        ndaTextEn: project.ndaTextEn,
        order: project.order,
        blocks: sectionsToBlocks(project.sections, project.heroImage),
      } satisfies AdminProject;
    }),
  };
}
