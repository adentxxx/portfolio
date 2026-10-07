"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

export type BloubPhase = "idle" | "travel" | "arrive";

type BloubProps = {
  phase: BloubPhase;
  emotionSrc: string;
  emotionLabel?: string;
  idleAnimation?: string | null;
  className?: string;
  size?: number;
};

export function Bloub({
  phase,
  emotionSrc,
  emotionLabel = "bloub",
  idleAnimation,
  className,
  size = 48,
}: BloubProps) {
  if (phase === "travel") {
    return (
      <span
        className={cn(
          "block rounded-full bg-surface-points transition-all duration-300",
          className,
        )}
        style={{ width: size * 0.35, height: size * 0.35 }}
        aria-hidden
      />
    );
  }

  const idleClass =
    phase === "idle"
      ? idleAnimation === "pulse"
        ? "bloub-idle-pulse"
        : idleAnimation === "float"
          ? "bloub-idle-float"
          : "bloub-idle-bob"
      : "";

  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center transition-transform duration-300",
        idleClass,
        className,
      )}
      style={{ width: size, height: size }}
      role="img"
      aria-label={emotionLabel}
    >
      <Image
        src={emotionSrc}
        alt=""
        width={size}
        height={size}
        className="h-full w-full object-contain"
        unoptimized
      />
    </span>
  );
}

export function TimelineDot({ className }: { className?: string }) {
  return (
    <span
      className={cn("size-3 rounded-full bg-surface-points", className)}
      aria-hidden
    />
  );
}
