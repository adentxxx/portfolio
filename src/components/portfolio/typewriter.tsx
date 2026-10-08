"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

type TypewriterProps = {
  /** Phrases to cycle through. Source: SiteSettings.introHeadline, one per line. */
  phrases: string[];
  /** Full cycle per phrase (type + hold + delete). */
  periodMs?: number;
  typeMs?: number;
  deleteMs?: number;
  className?: string;
};

/** Split the DB headline into phrases: one per line (or `|`-separated). */
export function parsePhrases(raw: string): string[] {
  return raw
    .split(/\r?\n|\s\|\s/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/**
 * Typewriter headline. SSR renders the first phrase in full (LCP/SEO, no
 * layout jump); on the client it holds, deletes, and types the next one so
 * that each phrase owns exactly `periodMs`.
 */
export function Typewriter({
  phrases,
  periodMs = 7000,
  typeMs = 55,
  deleteMs = 28,
  className,
}: TypewriterProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [text, setText] = useState(phrases[0] ?? "");
  const [typing, setTyping] = useState(false);
  const timer = useRef<number>(0);

  const single = phrases.length <= 1;

  useEffect(() => {
    if (single) return;
    let cancelled = false;
    const schedule = (fn: () => void, ms: number) => {
      timer.current = window.setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
    };

    const current = phrases[index] ?? "";
    const next = phrases[(index + 1) % phrases.length] ?? "";

    if (reducedMotion) {
      // No character animation: swap the whole phrase once per period.
      setText(current);
      schedule(() => setIndex((i) => (i + 1) % phrases.length), periodMs);
      return () => {
        cancelled = true;
        window.clearTimeout(timer.current);
      };
    }

    const deleteDuration = current.length * deleteMs;
    const typeDuration = next.length * typeMs;
    const hold = Math.max(800, periodMs - deleteDuration - typeDuration);

    const typeNext = (i: number) => {
      if (i > next.length) {
        setTyping(false);
        setIndex((v) => (v + 1) % phrases.length);
        return;
      }
      setText(next.slice(0, i));
      schedule(() => typeNext(i + 1), typeMs);
    };

    const eraseCurrent = (len: number) => {
      if (len < 0) {
        typeNext(1);
        return;
      }
      setText(current.slice(0, len));
      schedule(() => eraseCurrent(len - 1), deleteMs);
    };

    setText(current);
    schedule(() => {
      setTyping(true);
      eraseCurrent(current.length - 1);
    }, hold);

    return () => {
      cancelled = true;
      window.clearTimeout(timer.current);
    };
    // `phrases` is a fresh array each render from the parent; key on its content.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, phrases.join("\n"), periodMs, typeMs, deleteMs, reducedMotion, single]);

  return (
    <span className={cn("inline", className)} aria-live="off">
      <span aria-hidden={!single}>{text}</span>
      {single ? null : (
        <span className="sr-only">{phrases[index] ?? ""}</span>
      )}
      {single || reducedMotion ? null : (
        <span
          aria-hidden
          className={cn(
            "ml-[0.08em] inline-block h-[0.85em] w-[2px] translate-y-[0.1em] bg-accent-primary align-baseline",
            !typing && "typewriter-caret",
          )}
        />
      )}
    </span>
  );
}
