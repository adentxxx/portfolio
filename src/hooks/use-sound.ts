"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type SoundKind = "button" | "card" | "theme";

type SoundContextValue = {
  muted: boolean;
  setMuted: (value: boolean) => void;
  play: (kind?: SoundKind) => void;
};

const SoundContext = createContext<SoundContextValue | null>(null);

const SOUND_SRC: Record<SoundKind, string> = {
  button: "/sounds/click-button.wav",
  card: "/sounds/click-card.wav",
  theme: "/sounds/click-theme.wav",
};

export function SoundProvider({ children }: { children: ReactNode }) {
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("portfolio-muted");
    if (stored === "1") setMutedState(true);
  }, []);

  const setMuted = useCallback((value: boolean) => {
    setMutedState(value);
    localStorage.setItem("portfolio-muted", value ? "1" : "0");
  }, []);

  const play = useCallback(
    (kind: SoundKind = "button") => {
      if (muted) return;
      try {
        const audio = new Audio(SOUND_SRC[kind]);
        audio.volume = 0.35;
        void audio.play().catch(() => {
          /* gesture-gated; ignore autoplay rejection */
        });
      } catch {
        /* ignore */
      }
    },
    [muted],
  );

  const value = useMemo(
    () => ({ muted, setMuted, play }),
    [muted, setMuted, play],
  );

  return createElement(SoundContext.Provider, { value }, children);
}

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) {
    throw new Error("useSound must be used within SoundProvider");
  }
  return ctx;
}
