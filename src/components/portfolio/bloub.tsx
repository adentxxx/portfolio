"use client";

import { BloubBot } from "@/components/portfolio/bloub-bot";
import { toExpressionId, toStateId } from "@/lib/bloub-engine";
import { cn } from "@/lib/utils";

export type BloubPhase = "idle" | "arrive";

/** Shape of a `BloubEmotion` row as the UI needs it (see SDD §8.4). */
export type BloubEmotionLike = {
  label: string;
  /** engine state id, e.g. "wink" | "orbit" — see `SELECTABLE_STATES` */
  state: string;
  /** rest expression for `idle`, e.g. "heureux"; null = measured default */
  expression?: string | null;
};

type BloubProps = {
  phase: BloubPhase;
  emotion: BloubEmotionLike;
  /** `prefers-reduced-motion`: one static frame, no loop */
  reducedMotion?: boolean;
  /** Hidden (e.g. header bloub after the morph): stop the loop, keep the frame */
  paused?: boolean;
  className?: string;
  size?: number;
};

/**
 * The roadmap mascot. Body `accent/primary`, eyes `surface/page` (theme-aware),
 * animated by the vendored bloub engine (`@/lib/bloub-engine`).
 *
 * - idle   → lives on its own (breath, gaze drift, blinks)
 * - arrive → the emotion's readable pose, right away (the scale-in is CSS)
 */
export function Bloub({
  phase,
  emotion,
  reducedMotion = false,
  paused = false,
  className,
  size = 48,
}: BloubProps) {
  const state = toStateId(emotion.state);

  return (
    <span
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <BloubBot
        state={state}
        expression={toExpressionId(emotion.expression)}
        size={size}
        frozen={reducedMotion}
        paused={paused}
        label={emotion.label}
      />
    </span>
  );
}
