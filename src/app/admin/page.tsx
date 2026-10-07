import { AdminPanel } from "@/components/portfolio/admin-panel";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [companies, projects, emotions, settings] = await Promise.all([
    prisma.company.findMany({ orderBy: { order: "asc" } }),
    prisma.project.findMany({
      orderBy: { order: "asc" },
      include: { sections: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.bloubEmotion.findMany(),
    prisma.siteSettings.findUnique({ where: { id: "default" } }),
  ]);

  return (
    <main className="min-h-screen bg-surface-page px-4 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-title1 text-text-primary">Админка (MVP)</h1>
        <p className="mt-2 text-body text-text-secondary">
          Минимальный CRUD для демо-контента. Пароль по умолчанию:{" "}
          <code className="text-caption1">demo-admin</code> (env{" "}
          <code className="text-caption1">ADMIN_PASSWORD</code>).
        </p>
        <AdminPanel
          companies={companies}
          projects={projects.map((p) => ({
            ...p,
            tags: JSON.parse(p.tags) as string[],
          }))}
          emotions={emotions}
          settings={
            settings
              ? {
                  introHeadline: settings.introHeadline,
                  introBio: settings.introBio,
                  contactHeadline: settings.contactHeadline,
                  contactSubline: settings.contactSubline,
                }
              : null
          }
        />
      </div>
    </main>
  );
}
