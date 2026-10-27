"use client";

import {
  adminJson,
  isUnauthorized,
  uploadAdminFile,
} from "@/components/portfolio/admin/api";
import {
  AddBlockSelect,
  BlockEditor,
  type BlockEditorHandle,
} from "@/components/portfolio/admin/block-editor";
import {
  CheckField,
  Field,
  FileButton,
  Status,
  TrashButton,
  inputClass,
} from "@/components/portfolio/admin/fields";
import { BloubSettings } from "@/components/portfolio/admin/bloub-picker";
import { Button } from "@/components/ui/button";
import type { AdminCompany, AdminProject } from "@/lib/admin-data";
import {
  MONTH_OPTIONS,
  formatPeriod,
  formatPoint,
  type EditorBlock,
} from "@/lib/content-format";
import Image from "next/image";
import { useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";

function failMessage(error: unknown) {
  return error instanceof Error ? error.message : "Не удалось сохранить";
}

function MonthSelect({
  value,
  disabled,
  onChange,
}: {
  value: number | null;
  disabled?: boolean;
  onChange: (month: number | null) => void;
}) {
  return (
    <select
      value={value ?? ""}
      disabled={disabled}
      onChange={(event) =>
        onChange(event.target.value ? Number(event.target.value) : null)
      }
      className={inputClass}
    >
      <option value="">Месяц</option>
      {MONTH_OPTIONS.map((name, index) => (
        <option key={name} value={index + 1}>
          {name}
        </option>
      ))}
    </select>
  );
}

function YearInput({
  value,
  disabled,
  onChange,
}: {
  value: number | null;
  disabled?: boolean;
  onChange: (year: number | null) => void;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={1900}
      max={2100}
      step={1}
      placeholder="Год"
      disabled={disabled}
      value={value ?? ""}
      onChange={(event) =>
        onChange(event.target.value ? Number(event.target.value) : null)
      }
      className={inputClass}
    />
  );
}

function LogoField({
  src,
  onChange,
  onError,
}: {
  src: string;
  onChange: (src: string) => void;
  onError: (error: unknown) => void;
}) {
  const [uploading, setUploading] = useState(false);
  return (
    <div className="flex items-center gap-3">
      <Image
        src={src}
        alt=""
        width={64}
        height={64}
        unoptimized
        className="size-16 rounded-2xl border border-border-subtle bg-surface-page object-contain p-1"
      />
      <FileButton
        label={uploading ? "Загружаю…" : "Загрузить логотип"}
        disabled={uploading}
        onFiles={(files) => {
          const file = files[0];
          if (!file) return;
          setUploading(true);
          void uploadAdminFile(file, "image")
            .then(onChange)
            .catch((error: unknown) => onError(error))
            .finally(() => setUploading(false));
        }}
      />
    </div>
  );
}

export function ContentTab({
  companies: initialCompanies,
  projects: initialProjects,
  onUnauthorized,
}: {
  companies: AdminCompany[];
  projects: AdminProject[];
  onUnauthorized: () => void;
}) {
  const [companies, setCompanies] = useState(initialCompanies);
  const [projects, setProjects] = useState(initialProjects);
  const [openId, setOpenId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function report(error: unknown) {
    if (isUnauthorized(error)) {
      onUnauthorized();
      return;
    }
    setMessage(null);
    setError(failMessage(error));
  }

  async function addCompany() {
    setError(null);
    setMessage(null);
    try {
      const created = await adminJson<AdminCompany>("/api/admin/companies", {
        method: "POST",
      });
      setCompanies((prev) => [...prev, created]);
      setOpenId(created.id);
      setMessage("Компания добавлена. Она скрыта, пока не включите показ на сайте.");
    } catch (caught) {
      report(caught);
    }
  }

  async function addProject() {
    setError(null);
    setMessage(null);
    try {
      const created = await adminJson<AdminProject>("/api/admin/projects", {
        method: "POST",
      });
      setProjects((prev) => [...prev, created]);
      setOpenId(created.id);
      setMessage("Проект добавлен. Он скрыт, пока не включите показ на сайте.");
    } catch (caught) {
      report(caught);
    }
  }

  async function saveCompany(company: AdminCompany) {
    setSavingId(company.id);
    setError(null);
    setMessage(null);
    try {
      const updated = await adminJson<AdminCompany>("/api/admin/companies", {
        method: "PUT",
        body: JSON.stringify(company),
      });
      setCompanies((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      setMessage(`Компания «${updated.name}» сохранена`);
    } catch (caught) {
      report(caught);
    } finally {
      setSavingId(null);
    }
  }

  async function deleteCompany(company: AdminCompany) {
    if (!window.confirm(`Удалить компанию «${company.name}»?`)) return;
    setSavingId(company.id);
    setError(null);
    setMessage(null);
    try {
      await adminJson(`/api/admin/companies?id=${encodeURIComponent(company.id)}`, {
        method: "DELETE",
      });
      setCompanies((prev) => prev.filter((item) => item.id !== company.id));
      setOpenId(null);
      setMessage("Компания удалена");
    } catch (caught) {
      report(caught);
    } finally {
      setSavingId(null);
    }
  }

  async function saveProject(project: AdminProject) {
    setSavingId(project.id);
    setError(null);
    setMessage(null);
    try {
      const updated = await adminJson<AdminProject>("/api/admin/projects", {
        method: "PUT",
        body: JSON.stringify(project),
      });
      setProjects((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      setMessage(`Проект «${updated.title}» сохранён`);
    } catch (caught) {
      report(caught);
    } finally {
      setSavingId(null);
    }
  }

  async function deleteProject(project: AdminProject) {
    if (!window.confirm(`Удалить проект «${project.title}»?`)) return;
    setSavingId(project.id);
    setError(null);
    setMessage(null);
    try {
      await adminJson(`/api/admin/projects?id=${encodeURIComponent(project.id)}`, {
        method: "DELETE",
      });
      setProjects((prev) => prev.filter((item) => item.id !== project.id));
      setOpenId(null);
      setMessage("Проект удалён");
    } catch (caught) {
      report(caught);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-10">
      <Status message={message} error={error} />
      <p className="text-subheadline text-text-secondary">
        Компании стоят слева на главной, проекты справа. Скрытая карточка на
        сайте не показывается.
      </p>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-title3 text-text-primary">Компании</h2>
          <Button type="button" onClick={() => void addCompany()}>
            Добавить компанию
          </Button>
        </div>
        {companies.length === 0 ? (
          <p className="text-subheadline text-text-muted">Компаний пока нет.</p>
        ) : null}
        {companies.map((company) => (
          <CompanyEditor
            key={company.id}
            company={company}
            open={openId === company.id}
            saving={savingId === company.id}
            onToggle={() =>
              setOpenId((current) => (current === company.id ? null : company.id))
            }
            onChange={(patch) =>
              setCompanies((prev) =>
                prev.map((item) =>
                  item.id === company.id ? { ...item, ...patch } : item,
                ),
              )
            }
            onError={report}
            onSave={() => void saveCompany(company)}
            onDelete={() => void deleteCompany(company)}
          />
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-title3 text-text-primary">Проекты</h2>
          <Button type="button" onClick={() => void addProject()}>
            Добавить проект
          </Button>
        </div>
        {projects.length === 0 ? (
          <p className="text-subheadline text-text-muted">Проектов пока нет.</p>
        ) : null}
        {projects.map((project) => (
          <ProjectEditor
            key={project.id}
            project={project}
            open={openId === project.id}
            saving={savingId === project.id}
            onToggle={() =>
              setOpenId((current) => (current === project.id ? null : project.id))
            }
            onChange={(patch) =>
              setProjects((prev) =>
                prev.map((item) =>
                  item.id === project.id ? { ...item, ...patch } : item,
                ),
              )
            }
            onError={report}
            onSave={() => void saveProject(project)}
            onDelete={() => void deleteProject(project)}
          />
        ))}
      </section>
    </div>
  );
}

function CardShell({
  id,
  open,
  title,
  meta,
  hidden,
  onToggle,
  children,
}: {
  id: string;
  open: boolean;
  title: string;
  meta: string;
  hidden: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <article
      id={id}
      className="rounded-[24px] border border-border-subtle bg-surface-card p-5"
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center gap-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-caption1 text-text-muted">
            {meta || "Дата не задана"}
          </span>
          <span className="block truncate text-title3 text-text-primary">
            {title}
          </span>
        </span>
        {hidden ? (
          <span className="text-caption1 text-text-muted">Скрыто</span>
        ) : null}
        <span className="text-caption1 text-text-secondary">
          {open ? "Свернуть" : "Открыть"}
        </span>
      </button>
      {open ? <div className="mt-5">{children}</div> : null}
    </article>
  );
}

function CompanyEditor({
  company,
  open,
  saving,
  onToggle,
  onChange,
  onError,
  onSave,
  onDelete,
}: {
  company: AdminCompany;
  open: boolean;
  saving: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<AdminCompany>) => void;
  onError: (error: unknown) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const blocksRef = useRef<BlockEditorHandle>(null);
  const [blocksBusy, setBlocksBusy] = useState(false);
  const preview =
    formatPeriod(company) || company.dateLabel || "период не задан";

  return (
    <CardShell
      id={`company-${company.id}`}
      open={open}
      title={company.name}
      meta={preview}
      hidden={!company.published}
      onToggle={onToggle}
    >
      <fieldset disabled={saving} className="m-0 min-w-0 space-y-5 border-0 p-0">
        <CheckField
          checked={company.published}
          label="Показывать на сайте"
          onChange={(published) => onChange({ published })}
        />
        <section className="space-y-3">
          <h3 className="text-body text-text-primary">Карточка</h3>
          <LogoField
            src={company.logoSrc}
            onChange={(logoSrc) => onChange({ logoSrc })}
            onError={onError}
          />
          <Field label="Заголовок">
            <input
              value={company.name}
              onChange={(event) => onChange({ name: event.target.value })}
              className={inputClass}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Начало, месяц">
              <MonthSelect
                value={company.startMonth}
                onChange={(startMonth) => onChange({ startMonth })}
              />
            </Field>
            <Field label="Начало, год">
              <YearInput
                value={company.startYear}
                onChange={(startYear) => onChange({ startYear })}
              />
            </Field>
          </div>
          <CheckField
            checked={company.ongoing}
            label="По настоящее время"
            onChange={(ongoing) => onChange({ ongoing })}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Конец, месяц">
              <MonthSelect
                value={company.endMonth}
                disabled={company.ongoing}
                onChange={(endMonth) => onChange({ endMonth })}
              />
            </Field>
            <Field label="Конец, год">
              <YearInput
                value={company.endYear}
                disabled={company.ongoing}
                onChange={(endYear) => onChange({ endYear })}
              />
            </Field>
          </div>
          <p className="text-caption1 text-text-secondary">На карточке: {preview}</p>
          <Field label="Роль в компании">
            <input
              value={company.role}
              onChange={(event) => onChange({ role: event.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Описание для карточки">
            <textarea
              value={company.description}
              rows={4}
              onChange={(event) => onChange({ description: event.target.value })}
              className={inputClass}
            />
          </Field>
        </section>

        <section className="space-y-3">
          <h3 className="text-body text-text-primary">Описание работы</h3>
          <p className="text-caption2 text-text-muted">
            Подробный текст открывается в окне по нажатию на карточку места
            работы. На самой карточке остаётся короткое описание.
          </p>
          <BlockEditor
            ref={blocksRef}
            blocks={company.blocks}
            onChange={(blocks: EditorBlock[]) => onChange({ blocks })}
            onError={onError}
            onBusyChange={setBlocksBusy}
          />
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" mode="accent" onClick={onSave} disabled={saving}>
            {saving ? "Сохраняю…" : "Сохранить"}
          </Button>
          <AddBlockSelect
            disabled={saving || blocksBusy}
            onAdd={(kind) => blocksRef.current?.add(kind)}
          />
          <TrashButton className="ml-auto" onClick={onDelete} disabled={saving} />
        </div>
      </fieldset>
    </CardShell>
  );
}

function ProjectEditor({
  project,
  open,
  saving,
  onToggle,
  onChange,
  onError,
  onSave,
  onDelete,
}: {
  project: AdminProject;
  open: boolean;
  saving: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<AdminProject>) => void;
  onError: (error: unknown) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const blocksRef = useRef<BlockEditorHandle>(null);
  const [blocksBusy, setBlocksBusy] = useState(false);
  const preview =
    formatPoint(project.createdMonth, project.createdYear) ||
    project.dateLabel ||
    "дата не задана";
  const [tagDraft, setTagDraft] = useState("");

  function addTags(raw: string) {
    const parts = raw
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    const tags = [...project.tags];
    for (const part of parts) {
      if (!tags.some((tag) => tag.toLowerCase() === part.toLowerCase())) {
        tags.push(part);
      }
    }
    onChange({ tags });
    setTagDraft("");
  }

  return (
    <CardShell
      id={`project-${project.id}`}
      open={open}
      title={project.title}
      meta={preview}
      hidden={!project.published}
      onToggle={onToggle}
    >
      <fieldset disabled={saving} className="m-0 min-w-0 space-y-5 border-0 p-0">
        <CheckField
          checked={project.published}
          label="Показывать на сайте"
          onChange={(published) => onChange({ published })}
        />
        <section className="space-y-3">
          <h3 className="text-body text-text-primary">Карточка</h3>
          <LogoField
            src={project.logoSrc}
            onChange={(logoSrc) => onChange({ logoSrc })}
            onError={onError}
          />
          <Field label="Заголовок">
            <input
              value={project.title}
              onChange={(event) => onChange({ title: event.target.value })}
              className={inputClass}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Месяц создания">
              <MonthSelect
                value={project.createdMonth}
                onChange={(createdMonth) => onChange({ createdMonth })}
              />
            </Field>
            <Field label="Год создания">
              <YearInput
                value={project.createdYear}
                onChange={(createdYear) => onChange({ createdYear })}
              />
            </Field>
          </div>
          <p className="text-caption1 text-text-secondary">На карточке: {preview}</p>
          <Field label="Теги" hint="Enter или запятая добавляет тег. Нажатие на тег убирает его.">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    aria-label={`Убрать тег ${tag}`}
                    onClick={() =>
                      onChange({ tags: project.tags.filter((item) => item !== tag) })
                    }
                    className="card-tag flex items-center gap-1 rounded-lg bg-surface-inverse px-2 py-1 text-caption1"
                  >
                    <span className="text-accent-primary">#</span>
                    <span className="text-text-on-inverse">{tag}</span>
                  </button>
                ))}
              </div>
              <input
                value={tagDraft}
                placeholder="Новый тег"
                onChange={(event) => setTagDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === ",") {
                    event.preventDefault();
                    addTags(tagDraft);
                  }
                }}
                onBlur={() => {
                  if (!tagDraft.trim()) return;
                  flushSync(() => addTags(tagDraft));
                }}
                className={inputClass}
              />
            </div>
          </Field>
          <Field label="Описание для карточки">
            <textarea
              value={project.description}
              rows={4}
              onChange={(event) => onChange({ description: event.target.value })}
              className={inputClass}
            />
          </Field>
          <BloubSettings
            shape={project.bloubShape}
            state={project.bloubState}
            expression={project.bloubExpression}
            onChange={onChange}
          />
        </section>

        <section className="space-y-3">
          <h3 className="text-body text-text-primary">Страница проекта</h3>
          <Field
            label="Адрес страницы"
            hint="Латиницей. Если поменять адрес уже открытой страницы, старая ссылка перестанет работать."
          >
            <input
              value={project.slug}
              onChange={(event) => onChange({ slug: event.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Текст под заголовком">
            <textarea
              value={project.summary}
              rows={3}
              onChange={(event) => onChange({ summary: event.target.value })}
              className={inputClass}
            />
          </Field>
          <BlockEditor
            ref={blocksRef}
            blocks={project.blocks}
            allowImages
            onChange={(blocks) => onChange({ blocks })}
            onError={onError}
            onBusyChange={setBlocksBusy}
          />
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" mode="accent" onClick={onSave} disabled={saving}>
            {saving ? "Сохраняю…" : "Сохранить"}
          </Button>
          <AddBlockSelect
            allowImages
            disabled={saving || blocksBusy}
            onAdd={(kind) => blocksRef.current?.add(kind)}
          />
          <TrashButton className="ml-auto" onClick={onDelete} disabled={saving} />
        </div>
      </fieldset>
    </CardShell>
  );
}
