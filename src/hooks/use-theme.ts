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

        const transition = startCircularTransition(() => {
          // The browser calls this a frame or more later. Paint the goal as
          // it stands then, so a press made in between is not overwritten.
          flushSync(() => {
            applyTheme(wanted.current ?? next);
          });
        });

        if (!transition) {
          applyTheme(next);
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
