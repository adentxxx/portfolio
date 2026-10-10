"use client";

import { motion, useSpring } from "motion/react";
import { useRef, type MouseEvent, type ReactNode } from "react";

const springValues = { damping: 30, stiffness: 100, mass: 2 };

type TiltedSurfaceProps = {
  children: ReactNode;
  scaleOnHover?: number;
  rotateAmplitude?: number;
};

/**
 * Pointer tilt from React Bits Tilted Card: perspective on the host,
 * spring rotateX/rotateY/scale on the inner layer. No tooltip.
 */
export function TiltedSurface({
  children,
  scaleOnHover = 1.1,
  rotateAmplitude = 12,
}: TiltedSurfaceProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useSpring(0, springValues);
  const rotateY = useSpring(0, springValues);
  const scale = useSpring(1, springValues);

  function handleMouse(event: MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const offsetX = event.clientX - rect.left - rect.width / 2;
    const offsetY = event.clientY - rect.top - rect.height / 2;

    rotateX.set((offsetY / (rect.height / 2)) * -rotateAmplitude);
    rotateY.set((offsetX / (rect.width / 2)) * rotateAmplitude);
    scale.set(scaleOnHover);
  }

  return (
    <div
      ref={ref}
      className="relative w-full [perspective:800px]"
      onMouseMove={handleMouse}
      onMouseEnter={() => scale.set(scaleOnHover)}
      onMouseLeave={() => {
        scale.set(1);
        rotateX.set(0);
        rotateY.set(0);
      }}
    >
      <motion.div
        className="relative w-full [transform-style:preserve-3d]"
        style={{ rotateX, rotateY, scale }}
      >
        {children}
      </motion.div>
    </div>
  );
}
