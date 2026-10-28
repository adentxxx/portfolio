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
import {
  byRank,
  companySortRank,
  projectSortRank,
  rankBetween,
  type RankClock,
} from "@/lib/timeline-order";
import Image from "next/image";
import { useMemo, useRef, useState, type DragEvent, type ReactNode } from "react";
import { flushSync } from "react-dom";

function failMessage(error: unknown) {
  return error instanceof Error ? error.message : "Не удалось сохранить";
}

const PERIOD_KEYS = [
  "startMonth",
  "startYear",
  "endMonth",
  "endYear",
  "ongoing",
] as const satisfies readonly (keyof AdminCompany)[];

function arrayMove<T>(items: T[], from: number, to: number) {
  const next = items.slice();
  const [item] = next.splice(from, 1);
  if (!item) return items;
  next.splice(to, 0, item);
  return next;
}

function GripIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden className="size-4">
      <path
        fill="currentColor"
        d="M5 3.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm0 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm0 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM11 3.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm0 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm0 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"
      />
    </svg>
  );
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
  clock,
  onUnauthorized,
}: {
  companies: AdminCompany[];
  projects: AdminProject[];
  clock: RankClock;
  onUnauthorized: () => void;
}) {
  const [companies, setCompanies] = useState(initialCompanies);
  const [projects, setProjects] = useState(initialProjects);
  const [openId, setOpenId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const sortedCompanies = useMemo(
    () => byRank(companies, (company) => companySortRank(company, clock)),
    [companies, clock],
  );
  const sortedProjects = useMemo(
    () => byRank(projects, projectSortRank),
    [projects],
  );

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

  function changeCompany(id: string, patch: Partial<AdminCompany>) {
    setCompanies((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, ...patch };
        const periodEdited = PERIOD_KEYS.some(
          (key) => key in patch && patch[key] !== item[key],
        );
        if (periodEdited) next.manualRank = null;
        return next;
      }),
    );
  }

  async function setManualRank(id: string, manualRank: number | null) {
    const previous = companies;
    setCompanies((prev) =>
      prev.map((item) => (item.id === id ? { ...item, manualRank } : item)),
    );
    try {
      const updated = await adminJson<AdminCompany>("/api/admin/companies", {
        method: "PATCH",
        body: JSON.stringify({ id, manualRank }),
      });
      setCompanies((prev) =>
        prev.map((item) =>
          item.id === updated.id ? { ...item, manualRank: updated.manualRank } : item,
        ),
      );
    } catch (caught) {
      setCompanies(previous);
      report(caught);
    }
  }

  function moveCompany(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;
    const from = sortedCompanies.findIndex((company) => company.id === sourceId);
    const to = sortedCompanies.findIndex((company) => company.id === targetId);
    if (from < 0 || to < 0) return;
    const next = arrayMove(sortedCompanies, from, to);
    const above = to > 0 ? companySortRank(next[to - 1], clock) : null;
    const below =
      to < next.length - 1 ? companySortRank(next[to + 1], clock) : null;
    void setManualRank(sourceId, rankBetween(above, below));
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
        Компании стоят слева на главной, проекты справа. На сайте выше то, что
        новее: у места работы берётся конец периода, у проекта — дата создания.
        Место работы можно перетащить за ручку. Скрытая карточка на сайте не
        показывается.
      </p>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-title3 text-text-primary">Компании</h2>
          <Button type="button" onClick={() => void addCompany()}>
            Добавить компанию
          </Button>
        </div>
        {sortedCompanies.length === 0 ? (
          <p className="text-subheadline text-text-muted">Компаний пока нет.</p>
        ) : null}
        {sortedCompanies.map((company) => (
          <CompanyEditor
            key={company.id}
            company={company}
            open={openId === company.id}
            saving={savingId === company.id}
            dragging={dragId === company.id}
            dropOver={overId === company.id && dragId !== company.id}
            onToggle={() =>
              setOpenId((current) => (current === company.id ? null : company.id))
            }
            onChange={(patch) => changeCompany(company.id, patch)}
            onError={report}
            onSave={() => void saveCompany(company)}
            onDelete={() => void deleteCompany(company)}
            onResetOrder={() => void setManualRank(company.id, null)}
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", company.id);
              setDragId(company.id);
            }}
            onDragEnd={() => {
              setDragId(null);
              setOverId(null);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setOverId(company.id);
            }}
            onDrop={(event) => {
              event.preventDefault();
              const sourceId = dragId || event.dataTransfer.getData("text/plain");
              setDragId(null);
              setOverId(null);
              if (sourceId) moveCompany(sourceId, company.id);
            }}
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
        {sortedProjects.length === 0 ? (
          <p className="text-subheadline text-text-muted">Проектов пока нет.</p>
        ) : null}
        {sortedProjects.map((project) => (
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
  reorder,
  children,
}: {
  id: string;
  open: boolean;
  title: string;
  meta: string;
  hidden: boolean;
  onToggle: () => void;
  reorder?: {
    dragging: boolean;
    dropOver: boolean;
    onDragStart: (event: DragEvent<HTMLButtonElement>) => void;
    onDragEnd: () => void;
    onDragOver: (event: DragEvent<HTMLElement>) => void;
    onDrop: (event: DragEvent<HTMLElement>) => void;
  };
  children: ReactNode;
}) {
  return (
    <article
      id={id}
      onDragOver={reorder?.onDragOver}
      onDrop={reorder?.onDrop}
      className={
        reorder?.dropOver
          ? "rounded-[24px] border border-accent-primary bg-surface-card p-5"
          : reorder?.dragging
            ? "rounded-[24px] border border-border-subtle bg-surface-card p-5 opacity-60"
            : "rounded-[24px] border border-border-subtle bg-surface-card p-5"
      }
    >
      <div className="flex items-center gap-2">
        {reorder ? (
          <button
            type="button"
            draggable
            aria-label={`Перетащить «${title}»`}
            onDragStart={reorder.onDragStart}
            onDragEnd={reorder.onDragEnd}
            className="cursor-grab rounded-lg p-1 text-icon-muted hover:text-text-primary active:cursor-grabbing"
          >
            <GripIcon />
          </button>
        ) : null}
        <button
          type="button"
          aria-expanded={open}
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
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
      </div>
      {open ? <div className="mt-5">{children}</div> : null}
    </article>
  );
}

function CompanyEditor({
  company,
  open,
  saving,
  dragging,
  dropOver,
  onToggle,
  onChange,
  onError,
  onSave,
  onDelete,
  onResetOrder,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  company: AdminCompany;
  open: boolean;
  saving: boolean;
  dragging: boolean;
  dropOver: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<AdminCompany>) => void;
  onError: (error: unknown) => void;
  onSave: () => void;
  onDelete: () => void;
  onResetOrder: () => void;
  onDragStart: (event: DragEvent<HTMLButtonElement>) => void;
  onDragEnd: () => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
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
      meta={
        company.manualRank != null ? `${preview} · вручную` : preview
      }
      hidden={!company.published}
      onToggle={onToggle}
      reorder={{
        dragging,
        dropOver,
        onDragStart,
        onDragEnd,
        onDragOver,
        onDrop,
      }}
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
          <p className="text-caption1 text-text-secondary">
            На карточке: {preview}
            {company.manualRank != null ? (
              <>
                {" "}
                <button
                  type="button"
                  onClick={onResetOrder}
                  disabled={saving}
                  className="underline-offset-2 hover:underline disabled:opacity-50"
                >
                  Вернуть по дате
                </button>
              </>
            ) : null}
          </p>
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
          <BloubSettings
            shape={company.bloubShape}
            state={company.bloubState}
            expression={company.bloubExpression}
            onChange={onChange}
          />
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
