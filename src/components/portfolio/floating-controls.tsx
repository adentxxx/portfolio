"use client";

import { Button } from "@/components/ui/button";
import { useSound } from "@/hooks/use-sound";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { Moon, Sun, Volume2, VolumeX } from "lucide-react";

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
          <Moon className="size-6" strokeWidth={1.5} aria-hidden />
        ) : (
          <Sun className="size-6" strokeWidth={1.5} aria-hidden />
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
          <VolumeX className="size-6" strokeWidth={1.5} aria-hidden />
        ) : (
          <Volume2 className="size-6" strokeWidth={1.5} aria-hidden />
        )}
      </Button>
    </div>
  );
}
