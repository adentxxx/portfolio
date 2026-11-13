"use client";

import { adminJson } from "@/components/portfolio/admin/api";
import { ContentTab } from "@/components/portfolio/admin/content-tab";
import type { EditLang } from "@/components/portfolio/admin/fields";
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
  const [lang, setLang] = useState<EditLang>("ru");
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

        <div className="space-y-2 rounded-[24px] border border-border-subtle bg-surface-card p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-subheadline text-text-primary">
              Язык текстов
            </span>
            <div role="radiogroup" aria-label="Язык текстов" className="flex gap-2">
              {(
                [
                  ["ru", "Русский"],
                  ["en", "English"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={lang === id}
                  onClick={() => setLang(id)}
                  className={cn(
                    "rounded-[16px] px-4 py-2 text-subheadline",
                    lang === id
                      ? "bg-surface-inverse text-text-on-inverse"
                      : "bg-surface-control text-text-primary",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <p className="text-caption1 text-text-secondary">
            {lang === "en"
              ? "Вы редактируете английскую версию. В пустом поле серым виден русский текст: он и покажется на /en, пока перевода нет. Фото, даты, теги и порядок блоков общие для обоих языков."
              : "Вы редактируете русскую версию. Чтобы поправить перевод, переключитесь на English. Не забудьте сохранить блок перед уходом со страницы."}
          </p>
        </div>

        <div
          role="tabpanel"
          id="panel-main"
          aria-labelledby="tab-main"
          hidden={tab !== "main"}
        >
          <MainTab settings={settings} lang={lang} onUnauthorized={onUnauthorized} />
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
            lang={lang}
            onUnauthorized={onUnauthorized}
          />
        </div>
      </div>
    </main>
  );
}
