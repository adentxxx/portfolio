"use client";

import { adminJson } from "@/components/portfolio/admin/api";
import { ContentTab } from "@/components/portfolio/admin/content-tab";
import { MainTab } from "@/components/portfolio/admin/main-tab";
import { Button } from "@/components/ui/button";
import type {
  AdminCompany,
  AdminProject,
  AdminSettings,
} from "@/lib/admin-data";
import type { RankClock } from "@/lib/timeline-order";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Tab = "main" | "content";

export function AdminApp({
  settings,
  companies,
  projects,
  clock,
}: {
  settings: AdminSettings;
  companies: AdminCompany[];
  projects: AdminProject[];
  clock: RankClock;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("main");
  const [leaving, setLeaving] = useState(false);

  async function logout() {
    setLeaving(true);
    await adminJson("/api/admin/logout", { method: "POST" }).catch(() => null);
    router.refresh();
  }

  function onUnauthorized() {
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-surface-page px-4 py-10 pb-32">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-title1 text-text-primary">Админка</h1>
          <Button type="button" onClick={() => void logout()} disabled={leaving}>
            {leaving ? "Выхожу…" : "Выйти"}
          </Button>
        </div>

        <div role="tablist" aria-label="Разделы админки" className="flex gap-2">
          {(
            [
              ["main", "Основное"],
              ["content", "Контент"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-selected={tab === id}
              aria-controls={`panel-${id}`}
              onClick={() => setTab(id)}
              className={cn(
                "rounded-[20px] px-5 py-3 text-subheadline",
                tab === id
                  ? "bg-surface-control text-text-primary"
                  : "bg-surface-card text-text-secondary",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          id="panel-main"
          aria-labelledby="tab-main"
          hidden={tab !== "main"}
        >
          <MainTab settings={settings} onUnauthorized={onUnauthorized} />
        </div>
        <div
          role="tabpanel"
          id="panel-content"
          aria-labelledby="tab-content"
          hidden={tab !== "content"}
        >
          <ContentTab
            companies={companies}
            projects={projects}
            clock={clock}
            onUnauthorized={onUnauthorized}
          />
        </div>
      </div>
    </main>
  );
}
