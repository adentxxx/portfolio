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
  // Walking every control is only needed when the theme snapshot steals the
  // hit target, or when the click is on the theme/mute bar and may have landed
  // on the neighbouring button. Ordinary clicks trust the event target.
  const ambiguous =
    !target ||
    target === document.documentElement ||
    target === document.body ||
    target.closest("[data-sound='theme'], [data-sound='mute']") !== null;
  if (!ambiguous) return target;
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

/** A decoded sound and where its audible part begins, in seconds. */
type Clip = { buffer: AudioBuffer; offset: number };

/**
 * Encoders pad the start of a file with silence (an mp3 always has some).
 * Playing from the first audible sample takes that delay off every sound.
 */
function leadingSilence(buffer: AudioBuffer) {
  const data = buffer.getChannelData(0);
  const limit = Math.min(data.length, Math.floor(buffer.sampleRate * 0.25));
  for (let index = 0; index < limit; index += 1) {
    if (Math.abs(data[index]) > 0.004) {
      // Step back 1ms so the attack is not clipped.
      return Math.max(0, index / buffer.sampleRate - 0.001);
    }
  }
  return 0;
}

function startClip(ctx: AudioContext, clip: Clip) {
  const source = ctx.createBufferSource();
  source.buffer = clip.buffer;
  const gain = ctx.createGain();
  gain.gain.value = VOLUME;
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start(0, clip.offset);
}

type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
  webkitOfflineAudioContext?: typeof OfflineAudioContext;
};

export function SoundProvider({ children }: { children: ReactNode }) {
  const [muted, setMutedState] = useState(false);
  const mutedRef = useRef(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const clipsRef = useRef<Partial<Record<SoundKind, Clip>>>({});
  // Fallback for a format the browser cannot decode: one preloaded element
  // per sound, reused, instead of a new download on every press.
  const elementsRef = useRef<Partial<Record<SoundKind, HTMLAudioElement>>>({});

  useEffect(() => {
    // The Button Bar has no mute since Iteration 2. A choice saved by the old
    // button would leave the site silent with no way back, so drop it.
    try {
      localStorage.removeItem("portfolio-muted");
    } catch {
      /* private mode */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Fetch and decode while the page is idle, so the first press already
    // has a ready buffer. An offline context decodes without a gesture and
    // without waking the audio device.
    const load = () => {
      const audioWindow = window as AudioWindow;
      const Offline =
        window.OfflineAudioContext ?? audioWindow.webkitOfflineAudioContext;
      let decoder: OfflineAudioContext | null = null;
      try {
        decoder = Offline ? new Offline(1, 1, 44100) : null;
      } catch {
        decoder = null;
      }
      for (const kind of Object.keys(SOUND_SRC) as SoundKind[]) {
        const fallback = () => {
          if (cancelled || elementsRef.current[kind]) return;
          const audio = new Audio(SOUND_SRC[kind]);
          audio.preload = "auto";
          audio.volume = VOLUME;
          elementsRef.current[kind] = audio;
        };
        if (!decoder) {
          fallback();
          continue;
        }
        const target = decoder;
        void fetch(SOUND_SRC[kind])
          .then((response) => {
            if (!response.ok) throw new Error(String(response.status));
            return response.arrayBuffer();
          })
          .then((raw) => target.decodeAudioData(raw))
          .then((buffer) => {
            if (cancelled) return;
            clipsRef.current[kind] = { buffer, offset: leadingSilence(buffer) };
          })
          .catch(fallback);
      }
    };
    const idleWindow = window as Window & {
      requestIdleCallback?: (
        callback: () => void,
        options?: { timeout: number },
      ) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const idleId = idleWindow.requestIdleCallback?.(load, { timeout: 1500 });
    const timeoutId =
      idleId === undefined ? window.setTimeout(load, 200) : 0;
    return () => {
      cancelled = true;
      if (idleId !== undefined) idleWindow.cancelIdleCallback?.(idleId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  const setMuted = useCallback((value: boolean) => {
    mutedRef.current = value;
    setMutedState(value);
  }, []);

  const context = useCallback(() => {
    if (!ctxRef.current) {
      const audioWindow = window as AudioWindow;
      const Ctor = window.AudioContext ?? audioWindow.webkitAudioContext;
      // "interactive" asks for the smallest output buffer the device allows.
      ctxRef.current = new Ctor({ latencyHint: "interactive" });
    }
    return ctxRef.current;
  }, []);

  /** Kept for the unlock path below; decoding now happens on load. */
  const decode = useCallback((_kind: SoundKind, _ctx: AudioContext) => {}, []);

  const playWithElement = useCallback((kind: SoundKind) => {
    const audio = elementsRef.current[kind] ?? new Audio(SOUND_SRC[kind]);
    elementsRef.current[kind] = audio;
    audio.volume = VOLUME;
    try {
      audio.currentTime = 0;
    } catch {
      /* not seekable yet */
    }
    void audio.play().catch(() => {});
  }, []);

  const play = useCallback(
    (kind: SoundKind) => {
      if (mutedRef.current && kind !== "mute") return;
      const clip = clipsRef.current[kind];
      if (!clip) {
        playWithElement(kind);
        return;
      }
      let ctx: AudioContext;
      try {
        ctx = context();
      } catch {
        playWithElement(kind);
        return;
      }
      if (ctx.state === "running") {
        startClip(ctx, clip);
        return;
      }
      // Suspended (first press, or back from another tab). Resuming takes a
      // few milliseconds; a sound that would come later than that is stale
      // and is dropped instead of playing late.
      const at = performance.now();
      void ctx.resume().then(
        () => {
          if (performance.now() - at < 250) startClip(ctx, clip);
        },
        () => {},
      );
    },
    [context, playWithElement],
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
