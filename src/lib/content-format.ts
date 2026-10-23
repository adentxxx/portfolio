import { DEFAULT_FACES } from "@/lib/faces";

export const MONTH_OPTIONS = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
] as const;

const MONTH_SHORT = [
  "янв",
  "фев",
  "мар",
  "апр",
  "май",
  "июн",
  "июл",
  "авг",
  "сен",
  "окт",
  "ноя",
  "дек",
] as const;

const MONTH_ALIASES = [
  ["янв"],
  ["фев"],
  ["мар"],
  ["апр"],
  ["май", "мая"],
  ["июн"],
  ["июл"],
  ["авг"],
  ["сен"],
  ["окт"],
  ["ноя"],
  ["дек"],
] as const;

const RU: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

export type BlockKind = "heading" | "subheading" | "paragraph" | "image";

export type EditorBlock = {
  id: string;
  kind: BlockKind;
  text: string;
  imageSrc: string | null;
};

export type StoredBlock = {
  kind: BlockKind;
  text: string;
  imageSrc: string | null;
};

export type PeriodFields = {
  startMonth: number | null;
  startYear: number | null;
  endMonth: number | null;
  endYear: number | null;
  ongoing: boolean;
};

export function isSafePublicPath(src: string) {
  return (
    src.startsWith("/") &&
    !src.startsWith("//") &&
    !src.includes("..") &&
    !src.includes("\\") &&
    !src.includes(" ") &&
    !/[?#]/.test(src) &&
    src.length <= 300
  );
}

export function isSafeHref(href: string) {
  const value = href.trim();
  if (!value || value.length > 500) return false;
  if (value.startsWith("#")) return !value.includes("\\");
  if (value.startsWith("/")) return isSafePublicPath(value);
  try {
    const url = new URL(value);
    return (
      url.protocol === "http:" ||
      url.protocol === "https:" ||
      url.protocol === "mailto:" ||
      url.protocol === "tel:"
    );
  } catch {
    return false;
  }
}

export function parseFaces(raw: string | null | undefined) {
  if (!raw) return [...DEFAULT_FACES];
  try {
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value)) return [...DEFAULT_FACES];
    const faces = value.filter(
      (item): item is string =>
        typeof item === "string" && isSafePublicPath(item),
    );
    return faces.length > 0 ? faces : [...DEFAULT_FACES];
  } catch {
    return [...DEFAULT_FACES];
  }
}

export function formatPoint(month: number | null, year: number | null) {
  if (!year) return "";
  if (!month || month < 1 || month > 12) return String(year);
  return `${MONTH_SHORT[month - 1]} ${year}`;
}

export function formatPeriod(period: PeriodFields) {
  const start = formatPoint(period.startMonth, period.startYear);
  if (!start) return "";
  if (period.ongoing) return `${start} — н.в.`;
  const end = formatPoint(period.endMonth, period.endYear);
  return end ? `${start} — ${end}` : start;
}

export function parsePoint(raw: string) {
  const text = raw.trim().toLowerCase();
  const yearMatch = text.match(/(\d{4})/);
  if (!yearMatch) return { month: null, year: null };
  const year = Number(yearMatch[1]);
  let month: number | null = null;
  for (let index = 0; index < MONTH_ALIASES.length; index += 1) {
    if (MONTH_ALIASES[index].some((alias) => text.includes(alias))) {
      month = index + 1;
    }
  }
  return { month, year };
}

function isPresent(value: string) {
  return /н\s*\.?\s*в/.test(value) || value.includes("настоящ");
}

export function parsePeriod(label: string): PeriodFields {
  const empty: PeriodFields = {
    startMonth: null,
    startYear: null,
    endMonth: null,
    endYear: null,
    ongoing: false,
  };
  const parts = label
    .trim()
    .toLowerCase()
    .replace(/[–—−]/g, "-")
    .split(/\s*-\s*/);
  const start = parsePoint(parts[0] ?? "");
  if (!start.year) return empty;
  const rest = (parts[1] ?? "").trim();
  if (!rest) {
    return {
      startMonth: start.month,
      startYear: start.year,
      endMonth: null,
      endYear: null,
      ongoing: false,
    };
  }
  if (isPresent(rest)) {
    return {
      startMonth: start.month,
      startYear: start.year,
      endMonth: null,
      endYear: null,
      ongoing: true,
    };
  }
  const end = parsePoint(rest);
  return {
    startMonth: start.month,
    startYear: start.year,
    endMonth: end.month,
    endYear: end.year,
    ongoing: false,
  };
}

export function readPeriod<T extends PeriodFields & { dateLabel: string }>(
  input: T,
): T {
  if (input.startYear) return input;
  const parsed = parsePeriod(input.dateLabel);
  if (!parsed.startYear) return input;
  return { ...input, ...parsed };
}

export function readCreated(
  dateLabel: string,
  createdMonth: number | null,
  createdYear: number | null,
) {
  if (createdYear) return { createdMonth, createdYear };
  const point = parsePoint(dateLabel);
  return { createdMonth: point.month, createdYear: point.year };
}

export function slugify(value: string) {
  let out = "";
  for (const char of value.trim().toLowerCase()) {
    out += RU[char] ?? char;
  }
  return out
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

type SectionLike = {
  id: string;
  kind: string;
  heading: string;
  body: string;
  text: string;
  imageSrc: string | null;
};

export function sectionsToBlocks(
  sections: SectionLike[],
  heroImage?: string | null,
): EditorBlock[] {
  const blocks: EditorBlock[] = [];
  for (const section of sections) {
    if (section.kind === "heading" || section.kind === "subheading") {
      blocks.push({
        id: section.id,
        kind: section.kind,
        text: section.text || section.heading,
        imageSrc: null,
      });
      continue;
    }
    if (section.kind === "paragraph") {
      blocks.push({
        id: section.id,
        kind: "paragraph",
        text: section.text || section.body,
        imageSrc: null,
      });
      continue;
    }
    if (section.kind === "image") {
      if (section.imageSrc) {
        blocks.push({
          id: section.id,
          kind: "image",
          text: "",
          imageSrc: section.imageSrc,
        });
      }
      continue;
    }
    if (section.heading) {
      blocks.push({
        id: `${section.id}-h`,
        kind: "heading",
        text: section.heading,
        imageSrc: null,
      });
    }
    if (section.body) {
      blocks.push({
        id: `${section.id}-p`,
        kind: "paragraph",
        text: section.body,
        imageSrc: null,
      });
    }
    if (section.imageSrc) {
      blocks.push({
        id: `${section.id}-i`,
        kind: "image",
        text: "",
        imageSrc: section.imageSrc,
      });
    }
  }
  if (
    heroImage &&
    isSafePublicPath(heroImage) &&
    !blocks.some((block) => block.imageSrc === heroImage)
  ) {
    blocks.unshift({
      id: "hero",
      kind: "image",
      text: "",
      imageSrc: heroImage,
    });
  }
  return blocks;
}

export function parseEditorBlocks(
  raw: unknown,
  allowImages: boolean,
): StoredBlock[] | null {
  if (!Array.isArray(raw) || raw.length > 200) return null;
  const blocks: StoredBlock[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") return null;
    const kind = (item as { kind?: unknown }).kind;
    const text = (item as { text?: unknown }).text ?? "";
    const imageSrc = (item as { imageSrc?: unknown }).imageSrc ?? null;
    if (typeof text !== "string" || text.length > 20000) return null;
    if (kind === "heading" || kind === "subheading" || kind === "paragraph") {
      blocks.push({ kind, text, imageSrc: null });
      continue;
    }
    if (
      allowImages &&
      kind === "image" &&
      typeof imageSrc === "string" &&
      isSafePublicPath(imageSrc)
    ) {
      blocks.push({ kind: "image", text: "", imageSrc });
      continue;
    }
    return null;
  }
  return blocks;
}

export function readMonth(value: unknown): number | null | "bad" {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "number" || !Number.isInteger(value)) return "bad";
  if (value < 1 || value > 12) return "bad";
  return value;
}

export function readYear(value: unknown): number | null | "bad" {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "number" || !Number.isInteger(value)) return "bad";
  if (value < 1900 || value > 2100) return "bad";
  return value;
}
