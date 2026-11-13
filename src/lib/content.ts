import type { WorkBlock } from "@/components/portfolio/roadmap-card";
import {
  formatPeriod,
  formatPoint,
  parseFaces,
  readCreated,
  readPeriod,
} from "@/lib/content-format";
import { pick, type Locale } from "@/lib/i18n";
import { nbsp } from "@/lib/nbsp";
import { prisma } from "@/lib/prisma";
import { cache } from "react";
import {
  byRank,
  companySortRank,
  projectSortRank,
  rankClock,
} from "@/lib/timeline-order";

export type IntroLink = { label: string; href: string; icon?: string };
export type ContactLink = { label: string; href: string };

/** Russian typography (hanging prepositions) is for Russian text only. */
function typeset(text: string, locale: Locale) {
  return locale === "ru" ? nbsp(text) : text;
}

type StoredLink = {
  label: string;
  href: string;
  icon?: string;
  labelEn?: string;
  hrefEn?: string;
};

/** A button in the page language: its English label and address win on /en. */
function localLinks(raw: string, locale: Locale) {
  return (JSON.parse(raw) as StoredLink[]).map((link) => {
    const out: IntroLink = {
      label: typeset(pick(link.label, link.labelEn, locale), locale),
      href: pick(link.href, link.hrefEn, locale),
    };
    if (link.icon) out.icon = link.icon;
    return out;
  });
}

function textBlocks(
  blocks: { id: string; kind: string; text: string; textEn: string }[],
  locale: Locale,
): WorkBlock[] {
  return blocks.flatMap((block): WorkBlock[] => {
    if (
      block.kind !== "heading" &&
      block.kind !== "subheading" &&
      block.kind !== "paragraph"
    ) {
      return [];
    }
    return [
      {
        id: block.id,
        kind: block.kind,
        text: typeset(pick(block.text, block.textEn, locale), locale),
      },
    ];
  });
}

async function readSettings(locale: Locale) {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
  });
  if (!settings) {
    throw new Error("Site settings missing. Run: npm run db:seed");
  }
  return {
    intro: {
      headline: typeset(
        pick(settings.introHeadline, settings.introHeadlineEn, locale),
        locale,
      ),
      bio: typeset(pick(settings.introBio, settings.introBioEn, locale), locale),
      avatarSrc: settings.avatarSrc,
      faces: parseFaces(settings.avatarFacesJson),
      links: localLinks(settings.introLinksJson, locale),
    },
    contact: {
      headline: typeset(
        pick(settings.contactHeadline, settings.contactHeadlineEn, locale),
        locale,
      ),
      subline: typeset(
        pick(settings.contactSubline, settings.contactSublineEn, locale),
        locale,
      ),
      links: localLinks(settings.contactLinksJson, locale) as ContactLink[],
    },
  };
}

/** The date line is built from the period, so English needs no stored copy. */
function companyDate(
  company: Parameters<typeof readPeriod>[0],
  locale: Locale,
) {
  if (locale === "ru") return company.dateLabel;
  return formatPeriod(readPeriod(company), locale) || company.dateLabel;
}

function projectDate(
  project: {
    dateLabel: string;
    createdMonth: number | null;
    createdYear: number | null;
  },
  locale: Locale,
) {
  if (locale === "ru") return project.dateLabel;
  const created = readCreated(
    project.dateLabel,
    project.createdMonth,
    project.createdYear,
  );
  return (
    formatPoint(created.createdMonth, created.createdYear, locale) ||
    project.dateLabel
  );
}

export async function getHomeContent(locale: Locale = "ru") {
  const clock = rankClock(new Date());
  const [chrome, companies, projects] = await Promise.all([
    readSettings(locale),
    prisma.company.findMany({
      where: { published: true },
      select: {
        id: true,
        name: true,
        nameEn: true,
        role: true,
        roleEn: true,
        descriptionEn: true,
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
          select: { id: true, kind: true, text: true, textEn: true },
        },
      },
    }),
    prisma.project.findMany({
      where: { published: true },
      select: {
        id: true,
        slug: true,
        title: true,
        titleEn: true,
        descriptionEn: true,
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
  ]);

  const companyCards = byRank(
    companies.map((company) => ({
      kind: "company" as const,
      id: company.id,
      name: typeset(pick(company.name, company.nameEn, locale), locale),
      role: typeset(pick(company.role, company.roleEn, locale), locale),
      dateLabel: typeset(companyDate(company, locale), locale),
      description: typeset(
        pick(company.description, company.descriptionEn, locale),
        locale,
      ),
      logoSrc: company.logoSrc,
      url: company.url,
      bloubEmotion: company.bloubEmotion,
      bloubShape: company.bloubShape,
      bloubState: company.bloubState,
      bloubExpression: company.bloubExpression,
      blocks: textBlocks(company.blocks, locale),
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
      title: typeset(pick(project.title, project.titleEn, locale), locale),
      dateLabel: typeset(projectDate(project, locale), locale),
      description: typeset(
        pick(project.description, project.descriptionEn, locale),
        locale,
      ),
      tags: (JSON.parse(project.tags) as string[]).map((tag) =>
        typeset(tag, locale),
      ),
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
  };
}

/** Intro chrome plus the previous and next published case. */
export async function getProjectNav(slug: string, locale: Locale = "ru") {
  const [chrome, projects] = await Promise.all([
    readSettings(locale),
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
    contact: chrome.contact,
    prevSlug: index > 0 ? ordered[index - 1].slug : null,
    nextSlug:
      index >= 0 && index < ordered.length - 1
        ? ordered[index + 1].slug
        : null,
  };
}

export const getProjectBySlug = cache(
  async (slug: string, locale: Locale = "ru") => {
    const project = await prisma.project.findFirst({
      where: { slug, published: true },
      include: {
        sections: { orderBy: { sortOrder: "asc" } },
      },
    });
    if (!project) return null;
    return {
      ...project,
      title: typeset(pick(project.title, project.titleEn, locale), locale),
      dateLabel: typeset(projectDate(project, locale), locale),
      description: typeset(
        pick(project.description, project.descriptionEn, locale),
        locale,
      ),
      summary: typeset(pick(project.summary, project.summaryEn, locale), locale),
      ndaTitle: typeset(
        pick(project.ndaTitle, project.ndaTitleEn, locale),
        locale,
      ),
      ndaText: typeset(pick(project.ndaText, project.ndaTextEn, locale), locale),
      tags: (JSON.parse(project.tags) as string[]).map((tag) =>
        typeset(tag, locale),
      ),
      sections: project.sections.map((section) => {
        // Block rows keep their text in `text`; `heading` and `body` mirror
        // it. An English copy replaces all three, so the page reads one field.
        const en =
          locale === "en" && section.textEn.trim() ? section.textEn : null;
        const heading =
          en !== null && section.kind !== "paragraph" ? en : section.heading;
        const body =
          en !== null && section.kind === "paragraph" ? en : section.body;
        return {
          ...section,
          heading: typeset(heading, locale),
          body: typeset(body, locale),
          text: typeset(en ?? section.text, locale),
        };
      }),
    };
  },
);
