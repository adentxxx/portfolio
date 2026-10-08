"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

export type BloubPhase = "idle" | "arrive";

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
  const idleClass =
    phase === "idle"
      ? idleAnimation === "pulse"
        ? "bloub-idle-pulse"
        : idleAnimation === "float"
          ? "bloub-idle-float"
          : idleAnimation
            ? "bloub-idle-bob"
            : ""
      : "";

  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center",
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
