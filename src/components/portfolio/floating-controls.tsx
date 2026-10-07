"use client";

import { Button } from "@/components/ui/button";
import { useSound } from "@/hooks/use-sound";
import { useTheme } from "@/hooks/use-theme";
import { Moon, Sun, Volume2, VolumeX } from "lucide-react";

export function FloatingControls() {
  const { theme, toggleTheme } = useTheme();
  const { muted, setMuted, play } = useSound();

  return (
    <div className="fixed bottom-6 right-4 z-50 flex flex-col gap-3 md:bottom-8 md:right-8">
      <Button
        mode="icon"
        type="button"
        aria-label={theme === "light" ? "Включить тёмную тему" : "Включить светлую тему"}
        soundKind="theme"
        onClick={() => toggleTheme()}
      >
        {theme === "light" ? (
          <Moon className="size-5" aria-hidden />
        ) : (
          <Sun className="size-5" aria-hidden />
        )}
      </Button>
      <Button
        mode="icon"
        type="button"
        aria-label={muted ? "Включить звук" : "Выключить звук"}
        soundKind="button"
        onClick={() => {
          const next = !muted;
          setMuted(next);
          if (!next) play("button");
        }}
      >
        {muted ? (
          <VolumeX className="size-5" aria-hidden />
        ) : (
          <Volume2 className="size-5" aria-hidden />
        )}
      </Button>
    </div>
  );
}
