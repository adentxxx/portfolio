"use client";

import { Button } from "@/components/ui/button";
import { useSound } from "@/hooks/use-sound";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

function BarIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-6"
      aria-hidden
    >
      {children}
    </svg>
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
  const { theme, toggleTheme } = useTheme();
  const { muted, setMuted } = useSound();

  return (
    // Figma Button Bar: gap 12, 56px icon buttons with 24px glyphs.
    // Standalone: padding 40 from the corner. Embedded: parent owns the offset.
    <div
      className={cn(
        "flex flex-col gap-3",
        !embedded && "fixed bottom-6 right-4 z-50 md:bottom-10 md:right-10",
        className,
      )}
    >
      <Button
        mode="icon"
        type="button"
        aria-label={
          theme === "light" ? "Включить тёмную тему" : "Включить светлую тему"
        }
        data-sound="theme"
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          toggleTheme({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          });
        }}
      >
        {theme === "light" ? (
          <BarIcon>
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </BarIcon>
        ) : (
          <BarIcon>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </BarIcon>
        )}
      </Button>
      <Button
        mode="icon"
        type="button"
        aria-label={muted ? "Включить звук" : "Выключить звук"}
        data-sound="mute"
        onClick={() => setMuted(!muted)}
      >
        {muted ? (
          <BarIcon>
            <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />
            <path d="M22 9 16 15" />
            <path d="m16 9 6 6" />
          </BarIcon>
        ) : (
          <BarIcon>
            <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />
            <path d="M16 9a5 5 0 0 1 0 6" />
            <path d="M19.364 18.364a9 9 0 0 0 0-12.728" />
          </BarIcon>
        )}
      </Button>
    </div>
  );
}
