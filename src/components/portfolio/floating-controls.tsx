"use client";

import { useTheme } from "@/hooks/use-theme";
import { enter } from "@/lib/enter";
import { publicPath } from "@/lib/public-path";
import { cn } from "@/lib/utils";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

/**
 * Figma icons (Hicon / Outline) as exported: natural size and the offset
 * inside the 24px slot. Drawn as a mask so the glyph takes the text color.
 */
const ICONS = {
  globe: { src: "/icons/globe.svg", w: 21.5, h: 21.5, x: 1.25, y: 1.25 },
  moon: { src: "/icons/moon.svg", w: 18.0449, h: 20.8902, x: 3.25, y: 1.25 },
  sun: { src: "/icons/sun.svg", w: 23.5, h: 23.5, x: 0.25, y: 0.25 },
  settings: {
    src: "/icons/settings.svg",
    w: 20.6327,
    h: 22.6885,
    x: 1.68,
    y: 0.655,
  },
} as const;

function GlassIcon({ name }: { name: keyof typeof ICONS }) {
  const icon = ICONS[name];
  const image = `url("${publicPath(icon.src)}")`;
  const size = `${icon.w}px ${icon.h}px`;
  const position = `${icon.x}px ${icon.y}px`;
  return (
    <span
      aria-hidden
      className="glass-icon"
      style={{
        maskImage: image,
        WebkitMaskImage: image,
        maskSize: size,
        WebkitMaskSize: size,
        maskPosition: position,
        WebkitMaskPosition: position,
      }}
    />
  );
}

const THEME_OPTIONS = [
  { theme: "dark", icon: "moon", label: "Тёмная тема" },
  { theme: "light", icon: "sun", label: "Светлая тема" },
] as const;

/** Segmented theme switch. The thumb marks the theme that is on. */
function ThemeSwitch({
  orientation,
}: {
  orientation: "vertical" | "horizontal";
}) {
  const { theme, setTheme } = useTheme();
  // Counts user switches. Zero means first paint: the thumb must not slide
  // from the server-rendered slot to the stored theme.
  const [moves, setMoves] = useState(0);
  const index = theme === "dark" ? 0 : 1;

  return (
    <div
      role="radiogroup"
      aria-label="Тема"
      className={cn(
        "glass glass-switch",
        orientation === "vertical" ? "glass-switch-v" : "glass-switch-h",
      )}
      style={{ "--i": index } as CSSProperties}
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
            aria-label={option.label}
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

/** Language rows. English is listed but off until the translation exists. */
function LanguageItems({ onPick }: { onPick: () => void }) {
  return (
    <div role="menu" aria-label="Язык" className="glass-items">
      <button
        type="button"
        role="menuitemradio"
        aria-checked
        className="glass-item text-body"
        onClick={onPick}
      >
        <span className="glass-item-check">
          <CheckIcon />
        </span>
        Русский
      </button>
      <button
        type="button"
        role="menuitemradio"
        aria-checked={false}
        className="glass-item text-body"
        disabled
      >
        <span className="glass-item-check" />
        English
      </button>
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
      if (event.target instanceof Node && ref.current?.contains(event.target)) {
        return;
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
  useDismiss(ref, open, close);

  return (
    <div ref={ref} className="glass-lang" data-open={open || undefined}>
      <div className="glass glass-lang-surface">
        <div className="glass-lang-items" inert={!open}>
          <LanguageItems onPick={close} />
        </div>
        <button
          type="button"
          aria-label="Язык"
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
        aria-label="Настройки"
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
      {...enter(7)}
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
