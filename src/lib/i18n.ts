/**
 * Two languages. Russian is the default and lives at the root; English lives
 * under `/en`. Both are plain routes, so a static export carries both.
 */
export type Locale = "ru" | "en";

export const LOCALES = ["ru", "en"] as const;
export const DEFAULT_LOCALE: Locale = "ru";

/** Routes that exist in one language only. The language menu stays off there. */
const UNTRANSLATED = ["/admin", "/api"];

/** App path without the base path, e.g. `/en/projects/x` → `en`. */
export function localeFromPath(pathname: string | null | undefined): Locale {
  if (!pathname) return DEFAULT_LOCALE;
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "ru";
}

/** `/en/projects/x` → `/projects/x`, `/en` → `/`. */
export function stripLocale(pathname: string) {
  if (pathname === "/en") return "/";
  if (pathname.startsWith("/en/")) return pathname.slice(3);
  return pathname || "/";
}

/** `/projects/x` in the given language. Pass a path without a language. */
export function localizePath(path: string, locale: Locale) {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === "ru") return clean;
  return clean === "/" ? "/en" : `/en${clean}`;
}

export function isTranslatedPath(pathname: string) {
  const path = stripLocale(pathname);
  return !UNTRANSLATED.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

/** English copy when it is filled in, otherwise the Russian original. */
export function pick(
  ru: string,
  en: string | null | undefined,
  locale: Locale,
) {
  if (locale === "en" && en && en.trim()) return en;
  return ru;
}

/**
 * Interface copy that is not content: labels, hints, and names for screen
 * readers. Content (cards, cases, intro, contact) comes from the database.
 */
export const UI = {
  ru: {
    siteTitle: "Александр Проскуренко – быстро, дорого, аху...",
    siteName: "Александр Проскуренко",
    siteDescription:
      "Продуктовый дизайнер с опытом в Fintech, B2B, B2C и мобильных продуктах.",
    ogLocale: "ru_RU",
    work: "опыт работы",
    cases: "кейсы",
    startScrolling: "начинай скроллить",
    roadmapEnd: "Конец roadmap",
    close: "закрыть",
    tipAsk: "хочешь меня потрогать?",
    tipEw: "эу....",
    faceLabel: (index: number, total: number) =>
      `Эмоция ${index} из ${total}. Сменить`,
    theme: "Тема",
    themeDark: "Тёмная тема",
    themeLight: "Светлая тема",
    language: "Язык",
    settings: "Настройки",
    otherCases: "Другие кейсы",
    prevCase: "Предыдущий кейс",
    nextCase: "Следующий кейс",
    home: "На главную",
    notFoundTitle: "404. Куда-то не туда попал",
    notFoundBubble: "куда-то не туда попал...",
    videoPlay: "Воспроизвести видео",
    videoPause: "Пауза",
    present: "н.в.",
  },
  en: {
    siteTitle: "Alexander Proskurenko – fast, pricey, bada...",
    siteName: "Alexander Proskurenko",
    siteDescription:
      "Product designer with experience in fintech, B2B, B2C, and mobile products.",
    ogLocale: "en_US",
    work: "experience",
    cases: "cases",
    startScrolling: "start scrolling",
    roadmapEnd: "End of the roadmap",
    close: "close",
    tipAsk: "wanna poke me?",
    tipEw: "hey....",
    faceLabel: (index: number, total: number) =>
      `Face ${index} of ${total}. Change`,
    theme: "Theme",
    themeDark: "Dark theme",
    themeLight: "Light theme",
    language: "Language",
    settings: "Settings",
    otherCases: "Other cases",
    prevCase: "Previous case",
    nextCase: "Next case",
    home: "Home",
    notFoundTitle: "404. Took a wrong turn",
    notFoundBubble: "took a wrong turn...",
    videoPlay: "Play video",
    videoPause: "Pause",
    present: "Present",
  },
} as const;

export type UiCopy = (typeof UI)[Locale];
