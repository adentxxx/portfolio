"use client";

import { publicPath } from "@/lib/public-path";
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

type SoundKind = "click" | "theme" | "mute";

type SoundContextValue = {
  muted: boolean;
  setMuted: (value: boolean) => void;
  play: (kind: SoundKind) => void;
};

const SoundContext = createContext<SoundContextValue | null>(null);

/** Owner files from Desktop `Portfolio Project/sounds`. */
const SOUND_SRC: Record<SoundKind, string> = {
  click: publicPath("/sounds/click.mp3"),
  theme: publicPath("/sounds/drop_004.ogg"),
  mute: publicPath("/sounds/switch_005.ogg"),
};

const VOLUME = 0.45;

function controlAtPoint(x: number, y: number) {
  let found: Element | null = null;
  for (const el of document.querySelectorAll("button, a, [data-sound]")) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      found = el;
    }
  }
  return found;
}

/** The theme snapshot steals hit-testing, so the event target can be <html>
 * or the theme button while the cursor is on mute. Trust the coordinates. */
function pressedControl(event: MouseEvent | PointerEvent) {
  const target = event.target instanceof Element ? event.target : null;
  const atPoint = controlAtPoint(event.clientX, event.clientY);
  if (!atPoint) return target;
  if (isDisabledControl(atPoint)) return atPoint;
  const pointMark = atPoint.closest("[data-sound]");
  if (!pointMark) return target ?? atPoint;
  if (
    !target ||
    target === document.documentElement ||
    target === document.body
  ) {
    return atPoint;
  }
  const targetMark = target.closest("[data-sound]");
  if (targetMark && targetMark !== pointMark) return atPoint;
  return target;
}

function isDisabledControl(target: Element) {
  const control = target.closest(
    "button, input, select, textarea, a, [role='button']",
  );
  if (!control) return false;
  if (control instanceof HTMLButtonElement && control.disabled) return true;
  if (
    control instanceof HTMLInputElement ||
    control instanceof HTMLSelectElement ||
    control instanceof HTMLTextAreaElement
  ) {
    return control.disabled;
  }
  return control.getAttribute("aria-disabled") === "true";
}

function isTextEntry(target: Element) {
  const field = target.closest(
    "input, textarea, select, [contenteditable='true']",
  );
  if (!field) return false;
  if (field instanceof HTMLInputElement) {
    const type = field.type;
    return (
      type !== "button" &&
      type !== "submit" &&
      type !== "checkbox" &&
      type !== "radio" &&
      type !== "reset"
    );
  }
  return (
    field instanceof HTMLTextAreaElement ||
    field instanceof HTMLSelectElement ||
    field.getAttribute("contenteditable") === "true"
  );
}

function startBuffer(ctx: AudioContext, buffer: AudioBuffer) {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = VOLUME;
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

export function SoundProvider({ children }: { children: ReactNode }) {
  const [muted, setMutedState] = useState(false);
  const mutedRef = useRef(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const buffersRef = useRef<Partial<Record<SoundKind, AudioBuffer>>>({});
  const rawRef = useRef<Partial<Record<SoundKind, ArrayBuffer>>>({});
  const decodingRef = useRef<Partial<Record<SoundKind, Promise<void>>>>({});

  useEffect(() => {
    const stored = localStorage.getItem("portfolio-muted");
    if (stored === "1") {
      mutedRef.current = true;
      setMutedState(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    for (const kind of Object.keys(SOUND_SRC) as SoundKind[]) {
      void fetch(SOUND_SRC[kind])
        .then((response) => {
          if (!response.ok) throw new Error(String(response.status));
          return response.arrayBuffer();
        })
        .then((buffer) => {
          if (!cancelled) rawRef.current[kind] = buffer;
        })
        .catch(() => {
          /* HTMLAudio still tries the same URL on play */
        });
    }
    return () => {
      cancelled = true;
    };
  }, []);

  const setMuted = useCallback((value: boolean) => {
    mutedRef.current = value;
    setMutedState(value);
    localStorage.setItem("portfolio-muted", value ? "1" : "0");
  }, []);

  const context = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    return ctxRef.current;
  }, []);

  const decode = useCallback((kind: SoundKind, ctx: AudioContext) => {
    if (buffersRef.current[kind]) return;
    const raw = rawRef.current[kind];
    if (!raw || decodingRef.current[kind]) return;
    decodingRef.current[kind] = ctx
      .decodeAudioData(raw.slice(0))
      .then((buffer) => {
        buffersRef.current[kind] = buffer;
      })
      .catch(() => {
        /* keep the HTMLAudio fallback */
      });
  }, []);

  const playWithElement = useCallback((kind: SoundKind) => {
    const audio = new Audio(SOUND_SRC[kind]);
    audio.volume = VOLUME;
    return audio.play().then(
      () => true,
      () => false,
    );
  }, []);

  const play = useCallback(
    (kind: SoundKind) => {
      if (mutedRef.current && kind !== "mute") return;
      let ctx: AudioContext;
      try {
        ctx = context();
      } catch {
        void playWithElement(kind);
        return;
      }
      // One shot per call. A suspended context's resume() can resolve much
      // later, on the next gesture; that must not replay this sound.
      const at = performance.now();
      let played: "none" | "buffer" | "element" = "none";
      const startIfRunning = () => {
        if (played !== "none") return false;
        const buffer = buffersRef.current[kind];
        if (!buffer || ctx.state !== "running") return false;
        startBuffer(ctx, buffer);
        played = "buffer";
        return true;
      };
      const attempt = () => {
        if (startIfRunning()) return;
        if (played !== "none") return;
        played = "element";
        void playWithElement(kind).then((ok) => {
          if (!ok && played === "element") {
            played = "none";
            startIfRunning();
          }
        });
      };
      void ctx.resume().then(() => {
        if (performance.now() - at > 500) return;
        void decode(kind, ctx);
        startIfRunning();
      });
      decode(kind, ctx);
      const pending = decodingRef.current[kind];
      if (buffersRef.current[kind] || !pending) attempt();
      else void pending.then(attempt);
    },
    [context, decode, playWithElement],
  );

  useEffect(() => {
    // Theme / mute play on pointerdown, on the button that was actually
    // pressed. The click that follows can land elsewhere while the theme
    // transition is up; that click must not start a second sound.
    let gesture: "theme" | "mute" | null = null;

    const unlock = () => {
      const ctx = context();
      void ctx.resume();
      for (const kind of Object.keys(SOUND_SRC) as SoundKind[]) {
        decode(kind, ctx);
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      unlock();
      if (event.button !== 0) return;
      const target = pressedControl(event);
      if (!(target instanceof Element)) {
        gesture = null;
        return;
      }
      if (isDisabledControl(target)) return;
      const mark = target.closest("[data-sound]")?.getAttribute("data-sound");
      if (mark === "theme" || mark === "mute") {
        gesture = mark;
        play(mark);
        return;
      }
      gesture = null;
    };

    const onClick = (event: MouseEvent) => {
      if (event.button !== 0) return;
      const held = gesture;
      gesture = null;
      if (held === "theme" || held === "mute") return;
      const target = pressedControl(event);
      if (!(target instanceof Element)) return;
      if (isDisabledControl(target)) return;
      const mark = target.closest("[data-sound]")?.getAttribute("data-sound");
      if (mark === "theme" || mark === "mute") {
        play(mark);
        return;
      }
      if (mark === "none") return;
      if (isTextEntry(target)) return;
      play("click");
    };

    // Touch scroll ends on touchend, which is a real activation. Wheel is not,
    // so a desktop scroll still cannot start audio until a click or a key.
    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType === "mouse") return;
      unlock();
    };

    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("pointerup", onPointerUp, true);
    window.addEventListener("touchend", unlock, { passive: true });
    window.addEventListener("keydown", unlock);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("pointerup", onPointerUp, true);
      window.removeEventListener("touchend", unlock);
      window.removeEventListener("keydown", unlock);
      document.removeEventListener("click", onClick);
    };
  }, [context, decode, play]);

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
