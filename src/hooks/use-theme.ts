"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: (origin?: { x: number; y: number }) => void;
  setTheme: (theme: Theme) => void;
};

type ViewTransitionHandle = { ready: Promise<void> };

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

function resolveInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("portfolio-theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const themeRef = useRef<Theme>(theme);
  themeRef.current = theme;

  const applyTheme = useCallback((next: Theme) => {
    themeRef.current = next;
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("portfolio-theme", next);
    setThemeState(next);
  }, []);

  useEffect(() => {
    applyTheme(resolveInitialTheme());
  }, [applyTheme]);

  const setTheme = applyTheme;

  const toggleTheme = useCallback(
    (origin?: { x: number; y: number }) => {
      const next: Theme = themeRef.current === "light" ? "dark" : "light";
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

      const transition = startCircularTransition(() => {
        flushSync(() => {
          applyTheme(next);
        });
      });

      if (!transition) {
        applyTheme(next);
        return;
      }

      transition.ready.then(() => {
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
      });
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
