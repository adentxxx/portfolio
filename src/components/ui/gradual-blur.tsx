import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

type GradualBlurProps = {
  /** Number of stacked blur layers (React Bits default preset uses 3–5). */
  divCount?: number;
  /** Blur multiplier; each layer blurs `0.0625 * (progress * divCount + 1) * strength` rem. */
  strength?: number;
  /** Overall height of the blurred band. */
  height?: string;
  /** Exponential instead of linear blur progression. */
  exponential?: boolean;
  className?: string;
};

/**
 * Fixed bottom "gradual blur" — stacked backdrop-filter layers, each masked to
 * a thin horizontal band, so blur ramps up smoothly toward the viewport edge.
 * Reference: https://reactbits.dev/animations/gradual-blur
 */
export function GradualBlur({
  divCount = 3,
  strength = 2,
  height = "6rem",
  exponential = false,
  className,
}: GradualBlurProps) {
  const increment = 100 / divCount;

  const layers = Array.from({ length: divCount }, (_, i) => {
    const progress = (i + 1) / divCount;
    const blurValue = exponential
      ? Math.pow(2, progress * 4) * 0.0625 * strength
      : 0.0625 * (progress * divCount + 1) * strength;

    const p1 = Math.round((increment * i - increment) * 10) / 10;
    const p2 = Math.round(increment * i * 10) / 10;
    const p3 = Math.round(increment * (i + 1) * 10) / 10;
    const p4 = Math.round(increment * (i + 2) * 10) / 10;

    const mask = `linear-gradient(to bottom, transparent ${p1}%, black ${p2}%, black ${p3}%, transparent ${p4}%)`;

    const style: CSSProperties = {
      position: "absolute",
      inset: 0,
      maskImage: mask,
      WebkitMaskImage: mask,
      backdropFilter: `blur(${blurValue}rem)`,
      WebkitBackdropFilter: `blur(${blurValue}rem)`,
    };

    return <div key={i} style={style} />;
  });

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-40 isolate",
        className,
      )}
      style={{ height }}
    >
      {layers}
    </div>
  );
}
