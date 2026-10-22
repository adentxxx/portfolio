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
  setTheme: (theme: Theme) => void;
};

type ViewTransitionHandle = {
  ready: Promise<void>;
  finished: Promise<void>;
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

  const setTheme = applyTheme;
  // A second startViewTransition while the circle is still running crashes
  // Chrome (STATUS_BREAKPOINT). Ignore toggles until this one finishes.
  const themeAnimating = useRef(false);

  const toggleTheme = useCallback(
    (origin?: { x: number; y: number }) => {
      if (themeAnimating.current) return;

      const next: Theme = currentTheme() === "light" ? "dark" : "light";
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduced || !origin) {
        applyTheme(next);
        return;
      }

      const { x, y } = origin;
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );

      themeAnimating.current = true;
      const release = () => {
        themeAnimating.current = false;
      };

      const transition = startCircularTransition(() => {
        flushSync(() => {
          applyTheme(next);
        });
      });

      if (!transition) {
        release();
        applyTheme(next);
        return;
      }

      transition.finished.then(release, release);
      window.setTimeout(release, 1200);
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
    },
    [applyTheme],
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
