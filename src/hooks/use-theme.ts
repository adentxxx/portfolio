"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import { THEME_SOURCE_KEY, THEME_STORAGE_KEY } from "@/lib/theme";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: (origin?: { x: number; y: number }) => void;
  /** With an origin the new theme opens as a circle from that point. */
  setTheme: (theme: Theme, origin?: { x: number; y: number }) => void;
};

type ViewTransitionHandle = {
  ready: Promise<void>;
  finished: Promise<void>;
  skipTransition?: () => void;
};

function startCircularTransition(update: () => void): ViewTransitionHandle | null {
  const start = (
    document as Document & {
      startViewTransition?: (callback: () => void) => ViewTransitionHandle;
    }
  ).startViewTransition;
  if (typeof start !== "function") return null;
  try {
    return start.call(document, update);
  } catch {
    return null;
  }
}

/**
 * iPhone and iPad. Their View Transition snapshot drops backdrop-filter, so
 * the glass buttons lose their blur while the circle runs, and the snapshot
 * also swallows taps. They get the plain wipe below instead.
 */
function isIOS() {
  return (
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("-webkit-touch-callout", "none")
  );
}

let wipe: { el: HTMLElement; raf: number } | null = null;

function clearWipe() {
  if (!wipe) return;
  cancelAnimationFrame(wipe.raf);
  wipe.el.remove();
  wipe = null;
}

/**
 * The same circle without a View Transition. The theme changes at once; a
 * sheet in the old page color covers the content (it sits under the Button
 * Bar, which stays live and keeps its blur) and a round hole grows in it from
 * the pressed point, showing the new theme. The page stays interactive.
 */
function holeWipe(x: number, y: number, endRadius: number, apply: () => void) {
  clearWipe();
  const oldColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--surface-page")
    .trim();
  apply();
  if (!oldColor) return;

  const el = document.createElement("div");
  el.className = "theme-wipe";
  el.setAttribute("aria-hidden", "true");
  el.style.background = oldColor;
  document.body.appendChild(el);
  const width = el.clientWidth || window.innerWidth;
  const height = el.clientHeight || window.innerHeight;
  const start = performance.now();
  const duration = 620;

  const frame = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    // Same curve as the View Transition circle: fast out, soft landing.
    const eased = 1 - Math.pow(1 - t, 3);
    const r = Math.max(0.01, eased * endRadius);
    const hole = `path(evenodd, "M0 0H${width}V${height}H0Z M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z")`;
    el.style.setProperty("-webkit-clip-path", hole);
    el.style.clipPath = hole;
    if (t < 1 && wipe) {
      wipe.raf = requestAnimationFrame(frame);
    } else {
      clearWipe();
    }
  };
  wipe = { el, raf: requestAnimationFrame(frame) };
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function explicitTheme(): Theme | null {
  try {
    if (localStorage.getItem(THEME_SOURCE_KEY) !== "user") return null;
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    return null;
  }
  return null;
}

function currentTheme(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") return attr;
  return systemTheme();
}

function paintTheme(next: Theme, explicit: boolean) {
  const root = document.documentElement;
  if (explicit) {
    root.setAttribute("data-theme", next);
    root.style.colorScheme = next;
    return;
  }
  root.removeAttribute("data-theme");
  root.style.removeProperty("color-scheme");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  const applyTheme = useCallback((next: Theme) => {
    paintTheme(next, true);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
      localStorage.setItem(THEME_SOURCE_KEY, "user");
    } catch {
      /* private mode */
    }
    setThemeState(next);
  }, []);

  useLayoutEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const sync = () => {
      const chosen = explicitTheme();
      const next = chosen ?? (media.matches ? "dark" : "light");
      paintTheme(next, chosen !== null);
      setThemeState(next);
    };

    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  // A second startViewTransition while the circle is still running crashes
  // Chrome (STATUS_BREAKPOINT). A press during the circle must still answer
  // at once: cut the running circle short and start the next one as soon as
  // the browser reports the first as finished.
  const running = useRef<ViewTransitionHandle | null>(null);
  const queued = useRef(false);

  // The theme the last press asked for. A press names its theme, so two
  // quick presses never cancel out or get lost while a circle is drawing.
  const wanted = useRef<Theme | null>(null);

  const goTo = useCallback(
    (target: Theme, origin?: { x: number; y: number }) => {
      const busy = running.current !== null || queued.current;
      // The same theme asked again while its circle is still drawing.
      if (busy && wanted.current === target) return;
      wanted.current = target;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduced || !origin) {
        applyTheme(target);
        return;
      }

      const { x, y } = origin;

      const run = () => {
        // Read both here, not at the press: the cut-short circle has painted
        // its theme by now, and a later press may have changed the goal.
        const next = wanted.current;
        if (!next || next === currentTheme()) return;
        const endRadius = Math.hypot(
          Math.max(x, window.innerWidth - x),
          Math.max(y, window.innerHeight - y),
        );

        if (isIOS()) {
          holeWipe(x, y, endRadius, () => applyTheme(next));
          return;
        }

        const transition = startCircularTransition(() => {
          // The browser calls this a frame or more later. Paint the goal as
          // it stands then, so a press made in between is not overwritten.
          flushSync(() => {
            applyTheme(wanted.current ?? next);
          });
        });

        if (!transition) {
          // No View Transitions in this browser: same circle, plain wipe.
          holeWipe(x, y, endRadius, () => applyTheme(next));
          return;
        }

        running.current = transition;
        const release = () => {
          if (running.current === transition) running.current = null;
        };

        transition.finished.then(release, release);
        transition.ready.then(() => {
          try {
            document.documentElement.animate(
              {
                clipPath: [
                  `circle(0px at ${x}px ${y}px)`,
                  `circle(${endRadius}px at ${x}px ${y}px)`,
                ],
              },
              {
                duration: 700,
                easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                pseudoElement: "::view-transition-new(root)",
              },
            );
          } catch {
            release();
          }
        }, release);
      };

      const current = running.current;
      if (!current) {
        run();
        return;
      }

      // One press is already waiting for the circle to end.
      if (queued.current) return;
      queued.current = true;
      let started = false;
      const go = () => {
        if (started) return;
        started = true;
        queued.current = false;
        if (running.current === current) running.current = null;
        run();
      };
      current.finished.then(go, go);
      // If the browser never settles `finished`, do not swallow the press.
      window.setTimeout(go, 1000);
      try {
        current.skipTransition?.();
      } catch {
        /* older engines: wait for the circle to end */
      }
    },
    [applyTheme],
  );

  const setTheme = goTo;

  const toggleTheme = useCallback(
    (origin?: { x: number; y: number }) => {
      const busy = running.current !== null || queued.current;
      const base = busy && wanted.current ? wanted.current : currentTheme();
      goTo(base === "light" ? "dark" : "light", origin);
    },
    [goTo],
  );

  const value = useMemo(
    () => ({ theme, toggleTheme, setTheme }),
    [theme, toggleTheme, setTheme],
  );

  return createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
