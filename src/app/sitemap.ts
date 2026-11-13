import { localizePath } from "@/lib/i18n";
import { absolutePageUrl } from "@/lib/site-url";
import { prisma } from "@/lib/prisma";
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await prisma.project.findMany({
    where: { published: true, nda: false },
    select: { slug: true, createdYear: true, createdMonth: true },
    orderBy: [{ createdYear: "desc" }, { createdMonth: "desc" }, { order: "asc" }],
  });

  // One entry per language, each naming both versions of the page.
  const entries = async (
    path: string,
    rest: Omit<MetadataRoute.Sitemap[number], "url">,
  ): Promise<MetadataRoute.Sitemap> => {
    const ru = await absolutePageUrl(path);
    const en = await absolutePageUrl(localizePath(path, "en"));
    const alternates = { languages: { ru, en } };
    return [
      { url: ru, ...rest, alternates },
      { url: en, ...rest, alternates },
    ];
  };

  const cases = (
    await Promise.all(
      projects.map((project) =>
        entries(`/projects/${project.slug}`, {
          changeFrequency: "monthly",
          priority: 0.8,
          ...(project.createdYear
            ? {
                lastModified: new Date(
                  Date.UTC(
                    project.createdYear,
                    (project.createdMonth ?? 1) - 1,
                    1,
                  ),
                ),
              }
            : {}),
        }),
      ),
    )
  ).flat();

  return [
    ...(await entries("/", { changeFrequency: "weekly", priority: 1 })),
    ...cases,
  ];
}
