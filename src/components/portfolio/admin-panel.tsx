"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

type Company = {
  id: string;
  name: string;
  role: string;
  dateLabel: string;
  description: string;
  order: number;
  bloubEmotion: string;
  published: boolean;
};

type Project = {
  id: string;
  slug: string;
  title: string;
  dateLabel: string;
  description: string;
  tags: string[];
  order: number;
  bloubEmotion: string;
  summary: string;
  published: boolean;
};

type Emotion = { id: string; label: string };
type Settings = {
  introHeadline: string;
  introBio: string;
  contactHeadline: string;
  contactSubline: string;
};

export function AdminPanel({
  companies: initialCompanies,
  projects: initialProjects,
  emotions,
  settings: initialSettings,
}: {
  companies: Company[];
  projects: Project[];
  emotions: Emotion[];
  settings: Settings | null;
}) {
  const [password, setPassword] = useState("");
  const [companies, setCompanies] = useState(initialCompanies);
  const [projects, setProjects] = useState(initialProjects);
  const [settings, setSettings] = useState(initialSettings);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveCompany(company: Company) {
    setError(null);
    setMessage(null);
    const res = await fetch("/api/admin/companies", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify(company),
    });
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    const updated = (await res.json()) as Company;
    setCompanies((prev) =>
      prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
    );
    setMessage(`Компания «${updated.name}» сохранена`);
  }

  async function saveProject(project: Project) {
    setError(null);
    setMessage(null);
    const res = await fetch("/api/admin/projects", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({
        ...project,
        tags: project.tags,
      }),
    });
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    const updated = (await res.json()) as Project & { tags: string };
    setProjects((prev) =>
      prev.map((p) =>
        p.id === updated.id
          ? {
              ...p,
              ...updated,
              tags:
                typeof updated.tags === "string"
                  ? (JSON.parse(updated.tags) as string[])
                  : updated.tags,
            }
          : p,
      ),
    );
    setMessage(`Проект «${updated.title}» сохранён`);
  }

  async function saveSettings() {
    if (!settings) return;
    setError(null);
    setMessage(null);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify(settings),
    });
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    setMessage("Intro/contact сохранены");
  }

  return (
    <div className="mt-8 space-y-10">
      <label className="block">
        <span className="text-caption1 text-text-muted">Пароль админки</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-[16px] border border-border-default bg-surface-card px-4 py-3 text-body text-text-primary"
          placeholder="demo-admin"
        />
      </label>

      {message && (
        <p className="rounded-[16px] bg-surface-card px-4 py-3 text-subheadline text-accent-primary">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-[16px] bg-surface-card px-4 py-3 text-subheadline text-[tomato]">
          {error}
        </p>
      )}

      {settings && (
        <section className="space-y-3 rounded-[24px] border border-border-subtle bg-surface-card p-5">
          <h2 className="text-title3">Site settings</h2>
          {(
            [
              ["introHeadline", "Intro headline (печатная машинка: одна фраза на строку)"],
              ["introBio", "Intro bio"],
              ["contactHeadline", "Contact headline"],
              ["contactSubline", "Contact subline"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block">
              <span className="text-caption1 text-text-muted">{label}</span>
              <textarea
                value={settings[key]}
                onChange={(e) =>
                  setSettings({ ...settings, [key]: e.target.value })
                }
                rows={
                  key === "introHeadline"
                    ? 4
                    : key.includes("Bio") || key.includes("Subline")
                      ? 3
                      : 1
                }
                className="mt-1 w-full rounded-[12px] border border-border-default bg-surface-page px-3 py-2 text-subheadline"
              />
            </label>
          ))}
          <Button type="button" onClick={() => void saveSettings()}>
            Сохранить settings
          </Button>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-title3">Компании</h2>
        {companies.map((company) => (
          <div
            key={company.id}
            className="space-y-2 rounded-[24px] border border-border-subtle bg-surface-card p-5"
          >
            <input
              className="w-full rounded-[12px] border border-border-default bg-surface-page px-3 py-2 text-subheadline"
              value={company.name}
              onChange={(e) =>
                setCompanies((prev) =>
                  prev.map((c) =>
                    c.id === company.id ? { ...c, name: e.target.value } : c,
                  ),
                )
              }
            />
            <input
              className="w-full rounded-[12px] border border-border-default bg-surface-page px-3 py-2 text-subheadline"
              value={company.role}
              onChange={(e) =>
                setCompanies((prev) =>
                  prev.map((c) =>
                    c.id === company.id ? { ...c, role: e.target.value } : c,
                  ),
                )
              }
            />
            <textarea
              className="w-full rounded-[12px] border border-border-default bg-surface-page px-3 py-2 text-subheadline"
              rows={3}
              value={company.description}
              onChange={(e) =>
                setCompanies((prev) =>
                  prev.map((c) =>
                    c.id === company.id
                      ? { ...c, description: e.target.value }
                      : c,
                  ),
                )
              }
            />
            <label className="block text-caption1 text-text-muted">
              bloubEmotion
              <select
                className="mt-1 w-full rounded-[12px] border border-border-default bg-surface-page px-3 py-2 text-subheadline"
                value={company.bloubEmotion}
                onChange={(e) =>
                  setCompanies((prev) =>
                    prev.map((c) =>
                      c.id === company.id
                        ? { ...c, bloubEmotion: e.target.value }
                        : c,
                    ),
                  )
                }
              >
                {emotions.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.label}
                  </option>
                ))}
              </select>
            </label>
            <Button type="button" onClick={() => void saveCompany(company)}>
              Сохранить компанию
            </Button>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-title3">Проекты</h2>
        {projects.map((project) => (
          <div
            key={project.id}
            className="space-y-2 rounded-[24px] border border-border-subtle bg-surface-card p-5"
          >
            <input
              className="w-full rounded-[12px] border border-border-default bg-surface-page px-3 py-2 text-subheadline"
              value={project.title}
              onChange={(e) =>
                setProjects((prev) =>
                  prev.map((p) =>
                    p.id === project.id ? { ...p, title: e.target.value } : p,
                  ),
                )
              }
            />
            <input
              className="w-full rounded-[12px] border border-border-default bg-surface-page px-3 py-2 text-subheadline"
              value={project.slug}
              onChange={(e) =>
                setProjects((prev) =>
                  prev.map((p) =>
                    p.id === project.id ? { ...p, slug: e.target.value } : p,
                  ),
                )
              }
            />
            <textarea
              className="w-full rounded-[12px] border border-border-default bg-surface-page px-3 py-2 text-subheadline"
              rows={3}
              value={project.description}
              onChange={(e) =>
                setProjects((prev) =>
                  prev.map((p) =>
                    p.id === project.id
                      ? { ...p, description: e.target.value }
                      : p,
                  ),
                )
              }
            />
            <input
              className="w-full rounded-[12px] border border-border-default bg-surface-page px-3 py-2 text-subheadline"
              value={project.tags.join(", ")}
              onChange={(e) =>
                setProjects((prev) =>
                  prev.map((p) =>
                    p.id === project.id
                      ? {
                          ...p,
                          tags: e.target.value
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean),
                        }
                      : p,
                  ),
                )
              }
              placeholder="tags, comma, separated"
            />
            <label className="block text-caption1 text-text-muted">
              bloubEmotion
              <select
                className="mt-1 w-full rounded-[12px] border border-border-default bg-surface-page px-3 py-2 text-subheadline"
                value={project.bloubEmotion}
                onChange={(e) =>
                  setProjects((prev) =>
                    prev.map((p) =>
                      p.id === project.id
                        ? { ...p, bloubEmotion: e.target.value }
                        : p,
                    ),
                  )
                }
              >
                {emotions.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.label}
                  </option>
                ))}
              </select>
            </label>
            <Button type="button" onClick={() => void saveProject(project)}>
              Сохранить проект
            </Button>
          </div>
        ))}
      </section>
    </div>
  );
}
