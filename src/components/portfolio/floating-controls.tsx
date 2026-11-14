"use client";

import { GlassIcon } from "@/components/portfolio/glass-icon";
import { useLocale, useUi } from "@/hooks/use-locale";
import { useTheme } from "@/hooks/use-theme";
import { enter } from "@/lib/enter";
import {
  LOCALES,
  isTranslatedPath,
  localizePath,
  stripLocale,
} from "@/lib/i18n";
import { pagePath } from "@/lib/public-path";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

const THEME_OPTIONS = [
  { theme: "dark", icon: "moon", label: "themeDark" },
  { theme: "light", icon: "sun", label: "themeLight" },
] as const;

/** True when the point is inside the element's box. Hidden boxes are empty. */
function boxHas(el: Element, x: number, y: number) {
  const rect = el.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    x >= rect.left &&
    x <= rect.right &&
    y >= rect.top &&
    y <= rect.bottom
  );
}

/**
 * While a View Transition runs, its snapshot takes the hit test and a press
 * reports <html> or <body> as the target, wherever the finger is. Such a
 * press says nothing about where it landed; only its coordinates do.
 */
function isStolenPress(event: PointerEvent) {
  return (
    event.target === document.documentElement || event.target === document.body
  );
}

/** Segmented theme switch. The thumb marks the theme that is on. */
function ThemeSwitch({
  orientation,
}: {
  orientation: "vertical" | "horizontal";
}) {
  const { theme, setTheme } = useTheme();
  const ui = useUi();
  // Counts user switches. Zero means first paint: the thumb must not slide
  // from the server-rendered slot to the stored theme.
  const [moves, setMoves] = useState(0);
  const groupRef = useRef<HTMLDivElement>(null);

  // A press made while the theme circle is drawing never reaches the slot
  // (see isStolenPress), so the second quick press was lost. Find the slot
  // under the finger by its box and switch from here.
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!isStolenPress(event) || event.button !== 0) return;
      const group = groupRef.current;
      if (!group) return;
      for (const slot of group.querySelectorAll<HTMLElement>(".glass-seg")) {
        if (!boxHas(slot, event.clientX, event.clientY)) continue;
        const option = slot.dataset.option;
        if (option !== "light" && option !== "dark") return;
        const rect = slot.getBoundingClientRect();
        setMoves((count) => count + 1);
        setTheme(option, {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
        return;
      }
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, [setTheme]);

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={ui.theme}
      className={cn(
        "glass glass-switch",
        orientation === "vertical" ? "glass-switch-v" : "glass-switch-h",
      )}
    >
      <span
        aria-hidden
        className="glass-thumb"
        data-moved={moves > 0 || undefined}
      >
        <span
          key={moves}
          className="glass-thumb-fill"
          data-stretch={moves > 0 || undefined}
        />
      </span>
      {THEME_OPTIONS.map((option) => {
        const active = option.theme === theme;
        return (
          <button
            key={option.theme}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={ui[option.label]}
            // Thumb slot and icon colors come from CSS theme tokens, not from
            // this state: the server cannot know the theme, CSS does.
            data-option={option.theme}
            className="glass-seg"
            // The slot that is already on stays silent.
            data-sound={active ? "none" : "theme"}
            onClick={(event) => {
              // No early return on `active`: during a circle the state can
              // trail the press, and the hook drops a repeat by itself.
              const rect = event.currentTarget.getBoundingClientRect();
              if (!active) setMoves((count) => count + 1);
              setTheme(option.theme, {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
              });
            }}
          >
            <GlassIcon name={option.icon} />
          </button>
        );
      })}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-[18px]"
      aria-hidden
    >
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

/** Each language under its own name, so it reads the same on both versions. */
const LANGUAGE_NAMES = { ru: "Русский", en: "English" } as const;

/**
 * Language rows. Each row is a link to the same page in that language
 * (`/projects/x` and `/en/projects/x`), so it works without script and a
 * static host needs nothing extra. Pages with one language keep the other
 * row off.
 */
function LanguageItems({ onPick }: { onPick: () => void }) {
  const ui = useUi();
  const locale = useLocale();
  const pathname = usePathname() ?? "/";
  const translated = isTranslatedPath(pathname);
  const path = stripLocale(pathname);

  return (
    <div role="menu" aria-label={ui.language} className="glass-items">
      {LOCALES.map((option) => {
        const active = option === locale;
        const content = (
          <>
            <span className="glass-item-check">
              {active ? <CheckIcon /> : null}
            </span>
            {LANGUAGE_NAMES[option]}
          </>
        );
        if (active || !translated) {
          return (
            <button
              key={option}
              type="button"
              role="menuitemradio"
              aria-checked={active}
              lang={option}
              className="glass-item text-body"
              disabled={!active}
              onClick={onPick}
            >
              {content}
            </button>
          );
        }
        return (
          <Link
            key={option}
            href={pagePath(localizePath(path, option))}
            hrefLang={option}
            lang={option}
            role="menuitemradio"
            aria-checked={false}
            className="glass-item text-body"
            onClick={onPick}
          >
            {content}
          </Link>
        );
      })}
    </div>
  );
}

/** Close on a press outside the element and on Escape. */
function useDismiss(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  close: () => void,
) {
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const root = ref.current;
      if (event.target instanceof Node && root?.contains(event.target)) {
        return;
      }
      // During the theme circle the target is <html> even for a press on
      // the menu. Closing on it folded the menu under the finger; look at
      // where the press is instead.
      if (root && isStolenPress(event)) {
        for (const el of root.querySelectorAll(".glass")) {
          if (boxHas(el, event.clientX, event.clientY)) return;
        }
      }
      close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [ref, open, close]);
}

/** Desktop: the round language button grows into the menu and back. */
function LanguageMorph() {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const close = useRef(() => setOpen(false)).current;
  const ui = useUi();
  useDismiss(ref, open, close);

  return (
    <div ref={ref} className="glass-lang" data-open={open || undefined}>
      <div className="glass glass-lang-surface">
        <div className="glass-lang-items" inert={!open}>
          <LanguageItems onPick={close} />
        </div>
        <button
          type="button"
          aria-label={ui.language}
          aria-haspopup="menu"
          aria-expanded={open}
          tabIndex={open ? -1 : 0}
          className="glass-lang-trigger"
          onClick={() => setOpen(true)}
        >
          <GlassIcon name="globe" />
        </button>
      </div>
    </div>
  );
}

/** Phone: one settings button. Theme and language flow out above it. */
function SettingsMenu() {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const close = useRef(() => setOpen(false)).current;
  const ui = useUi();
  useDismiss(ref, open, close);

  return (
    <div ref={ref} className="glass-settings" data-open={open || undefined}>
      <div className="glass-settings-panel" inert={!open}>
        <ThemeSwitch orientation="horizontal" />
        <div className="glass glass-menu">
          <LanguageItems onPick={close} />
        </div>
      </div>
      <button
        type="button"
        aria-label={ui.settings}
        aria-haspopup="menu"
        aria-expanded={open}
        className="glass glass-button"
        onClick={() => setOpen((value) => !value)}
      >
        <GlassIcon name="settings" />
      </button>
    </div>
  );
}

export function FloatingControls({
  embedded = false,
  className,
}: {
  /** In document flow, so a parent can place the bar (mobile project page). */
  embedded?: boolean;
  className?: string;
}) {
  return (
    // Figma Button Bar, Iteration 2. From 768: language + theme in a column,
    // gap 16, 40 from the corner (405:13070). Below 768: one settings button,
    // 12 from the corner (405:14319). Embedded: the parent owns the offset.
    <div
      {...enter(7, "pop")}
      className={cn(
        !embedded && "fixed bottom-3 right-3 z-50 md:bottom-10 md:right-10",
        className,
      )}
    >
      <div className="hidden flex-col items-center gap-4 md:flex">
        <LanguageMorph />
        <ThemeSwitch orientation="vertical" />
      </div>
      <div className="md:hidden">
        <SettingsMenu />
      </div>
    </div>
  );
}
