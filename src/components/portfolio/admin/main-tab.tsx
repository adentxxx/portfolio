"use client";

import {
  adminJson,
  isUnauthorized,
  uploadAdminFile,
} from "@/components/portfolio/admin/api";
import {
  Field,
  FileButton,
  MoveButton,
  Status,
  TrashButton,
  inputClass,
} from "@/components/portfolio/admin/fields";
import { Button } from "@/components/ui/button";
import type { AdminLink, AdminSettings } from "@/lib/admin-data";
import Image from "next/image";
import { useState } from "react";

function move<T>(items: T[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) return items;
  const next = items.slice();
  const [item] = next.splice(index, 1);
  next.splice(nextIndex, 0, item);
  return next;
}

export function MainTab({
  settings: initial,
  onUnauthorized,
}: {
  settings: AdminSettings;
  onUnauthorized: () => void;
}) {
  const [settings, setSettings] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function report(caught: unknown) {
    if (isUnauthorized(caught)) {
      onUnauthorized();
      return;
    }
    setMessage(null);
    setError(caught instanceof Error ? caught.message : "Не удалось сохранить");
  }

  async function addFaces(files: File[]) {
    setUploading(true);
    setError(null);
    try {
      const added: string[] = [];
      for (const file of files) added.push(await uploadAdminFile(file, "image"));
      setSettings((current) => ({
        ...current,
        faces: [...current.faces, ...added].slice(0, 12),
      }));
    } catch (caught) {
      report(caught);
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await adminJson<AdminSettings>("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      setSettings(updated);
      setMessage("Основное сохранено");
    } catch (caught) {
      report(caught);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <Status message={message} error={error} />

      <section className="space-y-3 rounded-[24px] border border-border-subtle bg-surface-card p-5">
        <h2 className="text-title3 text-text-primary">Фотографии</h2>
        <p className="text-subheadline text-text-secondary">
          Эти портреты стоят на главной и в шапке кейса. Нажатие переключает
          их по порядку в списке.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {settings.faces.map((src, index) => (
            <div
              key={`${src}-${index}`}
              className="space-y-2 rounded-[16px] border border-border-subtle bg-surface-page p-2"
            >
              <Image
                src={src}
                alt=""
                width={160}
                height={160}
                unoptimized
                className="aspect-square w-full object-contain"
              />
              <div className="flex flex-wrap gap-2">
                <MoveButton
                  direction="left"
                  label="Левее"
                  disabled={index === 0 || uploading}
                  onClick={() =>
                    setSettings((current) => ({
                      ...current,
                      faces: move(current.faces, index, -1),
                    }))
                  }
                />
                <MoveButton
                  direction="right"
                  label="Правее"
                  disabled={index === settings.faces.length - 1 || uploading}
                  onClick={() =>
                    setSettings((current) => ({
                      ...current,
                      faces: move(current.faces, index, 1),
                    }))
                  }
                />
                <TrashButton
                  disabled={settings.faces.length === 1 || uploading}
                  onClick={() =>
                    setSettings((current) => ({
                      ...current,
                      faces: current.faces.filter((_, faceIndex) => faceIndex !== index),
                    }))
                  }
                />
              </div>
            </div>
          ))}
        </div>
        <FileButton
          label={uploading ? "Загружаю…" : "Загрузить фото"}
          multiple
          disabled={uploading || settings.faces.length >= 12}
          onFiles={(files) => void addFaces(files)}
        />
      </section>

      <section className="space-y-3 rounded-[24px] border border-border-subtle bg-surface-card p-5">
        <h2 className="text-title3 text-text-primary">Заголовок и описание</h2>
        <Field
          label="Заголовок"
          hint="Одна фраза на строку. Фразы сменяются каждые 7 секунд."
        >
          <textarea
            value={settings.introHeadline}
            rows={4}
            onChange={(event) =>
              setSettings({ ...settings, introHeadline: event.target.value })
            }
            className={inputClass}
          />
        </Field>
        <Field label="Описание">
          <textarea
            value={settings.introBio}
            rows={4}
            onChange={(event) =>
              setSettings({ ...settings, introBio: event.target.value })
            }
            className={inputClass}
          />
        </Field>
        <LinkEditor
          label="Кнопки под описанием"
          links={settings.introLinks}
          onChange={(introLinks) => setSettings({ ...settings, introLinks })}
        />
      </section>

      <section className="space-y-3 rounded-[24px] border border-border-subtle bg-surface-card p-5">
        <h2 className="text-title3 text-text-primary">Обратная связь</h2>
        <Field label="Заголовок">
          <input
            value={settings.contactHeadline}
            onChange={(event) =>
              setSettings({ ...settings, contactHeadline: event.target.value })
            }
            className={inputClass}
          />
        </Field>
        <Field label="Текст">
          <textarea
            value={settings.contactSubline}
            rows={3}
            onChange={(event) =>
              setSettings({ ...settings, contactSubline: event.target.value })
            }
            className={inputClass}
          />
        </Field>
        <LinkEditor
          label="Кнопки"
          links={settings.contactLinks}
          onChange={(contactLinks) => setSettings({ ...settings, contactLinks })}
        />
      </section>

      <Button type="button" mode="accent" onClick={() => void save()} disabled={saving || uploading}>
        {saving ? "Сохраняю…" : "Сохранить основное"}
      </Button>
    </div>
  );
}

function LinkEditor({
  label,
  links,
  onChange,
}: {
  label: string;
  links: AdminLink[];
  onChange: (links: AdminLink[]) => void;
}) {
  return (
    <div className="space-y-2">
      <span className="text-caption1 text-text-muted">{label}</span>
      {links.map((link, index) => (
        <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
          <input
            value={link.label}
            aria-label={`${label}, подпись ${index + 1}`}
            onChange={(event) =>
              onChange(
                links.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, label: event.target.value } : item,
                ),
              )
            }
            className={inputClass}
          />
          <input
            value={link.href}
            aria-label={`${label}, ссылка ${index + 1}`}
            onChange={(event) =>
              onChange(
                links.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, href: event.target.value } : item,
                ),
              )
            }
            className={inputClass}
          />
          <TrashButton
            label={`${label}, удалить ${index + 1}`}
            onClick={() => onChange(links.filter((_, itemIndex) => itemIndex !== index))}
          />
        </div>
      ))}
      <Button
        type="button"
        onClick={() => onChange([...links, { label: "", href: "" }])}
      >
        Добавить кнопку
      </Button>
    </div>
  );
}
