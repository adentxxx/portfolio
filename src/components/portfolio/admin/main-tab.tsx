"use client";

import {
  adminJson,
  isUnauthorized,
  uploadAdminFile,
} from "@/components/portfolio/admin/api";
import {
  FileButton,
  LangField,
  MoveButton,
  Status,
  TrashButton,
  inputClass,
  type EditLang,
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
  lang,
  onUnauthorized,
}: {
  settings: AdminSettings;
  lang: EditLang;
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
          Эти портреты стоят на главной и в шапке кейса. Нажатие переключает
          их по порядку в списке.
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
        <LangField
          label="Заголовок"
          hint="Одна фраза на строку. Фразы сменяются каждые 7 секунд."
          lang={lang}
          rows={4}
          ru={settings.introHeadline}
          en={settings.introHeadlineEn}
          onRu={(introHeadline) => setSettings({ ...settings, introHeadline })}
          onEn={(introHeadlineEn) =>
            setSettings({ ...settings, introHeadlineEn })
          }
        />
        <LangField
          label="Описание"
          lang={lang}
          rows={4}
          ru={settings.introBio}
          en={settings.introBioEn}
          onRu={(introBio) => setSettings({ ...settings, introBio })}
          onEn={(introBioEn) => setSettings({ ...settings, introBioEn })}
        />
        <LinkEditor
          label="Кнопки под описанием"
          lang={lang}
          links={settings.introLinks}
          onChange={(introLinks) => setSettings({ ...settings, introLinks })}
        />
      </section>

      <section className="space-y-3 rounded-[24px] border border-border-subtle bg-surface-card p-5">
        <h2 className="text-title3 text-text-primary">Обратная связь</h2>
        <LangField
          label="Заголовок"
          lang={lang}
          ru={settings.contactHeadline}
          en={settings.contactHeadlineEn}
          onRu={(contactHeadline) =>
            setSettings({ ...settings, contactHeadline })
          }
          onEn={(contactHeadlineEn) =>
            setSettings({ ...settings, contactHeadlineEn })
          }
        />
        <LangField
          label="Текст"
          lang={lang}
          rows={3}
          ru={settings.contactSubline}
          en={settings.contactSublineEn}
          onRu={(contactSubline) =>
            setSettings({ ...settings, contactSubline })
          }
          onEn={(contactSublineEn) =>
            setSettings({ ...settings, contactSublineEn })
          }
        />
        <LinkEditor
          label="Кнопки"
          lang={lang}
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
  lang,
  links,
  onChange,
}: {
  label: string;
  lang: EditLang;
  links: AdminLink[];
  onChange: (links: AdminLink[]) => void;
}) {
  const english = lang === "en";
  const patch = (index: number, change: Partial<AdminLink>) =>
    onChange(
      links.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...change } : item,
      ),
    );

  return (
    <div className="space-y-2">
      <span className="text-caption1 text-text-muted">
        {english ? `${label} · English` : label}
      </span>
      {english ? (
        <p className="text-caption2 text-text-muted">
          Пустая подпись или ссылка берётся из русской версии. Свою ссылку
          стоит задать, если она ведёт на английский файл, например CV.
        </p>
      ) : null}
      {links.map((link, index) => (
        <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
          <input
            value={english ? (link.labelEn ?? "") : link.label}
            placeholder={english ? link.label : undefined}
            aria-label={`${label}, подпись ${index + 1}`}
            onChange={(event) =>
              patch(
                index,
                english
                  ? { labelEn: event.target.value }
                  : { label: event.target.value },
              )
            }
            className={inputClass}
          />
          <input
            value={english ? (link.hrefEn ?? "") : link.href}
            placeholder={english ? link.href : undefined}
            aria-label={`${label}, ссылка ${index + 1}`}
            onChange={(event) =>
              patch(
                index,
                english
                  ? { hrefEn: event.target.value }
                  : { href: event.target.value },
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
