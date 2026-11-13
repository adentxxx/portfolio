import type { CSSProperties } from "react";

/**
 * Page-load entrance (SDD §4.5). Spread on an element:
 *
 * - `rise`: up 16px, opacity, short blur. Small pieces: text, buttons, avatar.
 * - `lift`: up 20px and opacity, no blur. Large blocks: photos, video.
 * - `fade`: opacity only. Blocks whose position is measured on mount, where a
 *   shift would be read as geometry (the roadmap).
 *
 * `step` is the place in the queue, 80ms apart. The animation is plain CSS
 * in globals.css, so it starts with the first paint and needs no script.
 */
export function enter(step: number, kind: "rise" | "lift" | "fade" = "rise") {
  return {
    "data-enter": kind,
    style: { "--enter": step } as CSSProperties,
  };
}
