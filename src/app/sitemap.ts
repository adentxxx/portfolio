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

  const cases: MetadataRoute.Sitemap = await Promise.all(
    projects.map(async (project) => {
      const entry: MetadataRoute.Sitemap[number] = {
        url: await absolutePageUrl(`/projects/${project.slug}`),
        changeFrequency: "monthly",
        priority: 0.8,
      };
      if (project.createdYear) {
        entry.lastModified = new Date(
          Date.UTC(project.createdYear, (project.createdMonth ?? 1) - 1, 1),
        );
      }
      return entry;
    }),
  );

  return [
    {
      url: await absolutePageUrl("/"),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...cases,
  ];
}
