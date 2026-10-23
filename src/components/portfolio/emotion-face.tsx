"use client";

import { useSound } from "@/hooks/use-sound";
import { DEFAULT_FACES } from "@/lib/faces";
import { publicPath } from "@/lib/public-path";
import { motion, useAnimation } from "motion/react";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { flushSync } from "react-dom";

const TIP_ASK = "хочешь меня потрогать?";
const TIP_EW = "эу....";

type TipPhase = "ask" | "ew" | "gone";

const POINT_1 = "/tooltip/point-1.svg";
const POINT_2 = "/tooltip/point-2.svg";

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return reduced;
}

function dotMask(src: string, width: number) {
  const url = `url("${publicPath(src)}")`;
  return {
    maskImage: url,
    WebkitMaskImage: url,
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskSize: `${width}px 48px`,
    WebkitMaskSize: `${width}px 48px`,
    maskPosition: "0 0",
    WebkitMaskPosition: "0 0",
  } as const;
}

type EmotionFaceProps = {
  /** Home portrait is 140. Project header is 80. */
  size?: 80 | 140;
  /** Portrait files from the admin. Empty falls back to the shipped cutouts. */
  faces?: readonly string[];
};

/**
 * Cutout portrait. Click pulses the current face to 110% and back to 100%,
 * then swaps to the next file.
 */
export function EmotionFace({ size = 140, faces: facesProp }: EmotionFaceProps) {
  const faces = facesProp && facesProp.length > 0 ? facesProp : DEFAULT_FACES;
  const faceKey = faces.join("|");
  const { play } = useSound();
  const tipId = useId();
  const [index, setIndex] = useState(0);
  const [over, setOver] = useState(false);
  const [tip, setTip] = useState<TipPhase>("ask");
  const indexRef = useRef(0);
  const runRef = useRef(0);
  const controls = useAnimation();
  const reduced = useReducedMotion();
  const tipVisible = over && tip !== "gone";

  useEffect(() => {
    setIndex(0);
    indexRef.current = 0;
  }, [faceKey]);

  useEffect(() => {
    for (const src of faces) {
      const img = new window.Image();
      img.src = publicPath(src);
    }
  }, [faceKey, faces]);

  function cycle() {
    // The shared click listener misses this press: React commits before the
    // event reaches document. Play the same click here, and opt out there.
    play("click");
    setTip((current) => (current === "ask" ? "ew" : "gone"));
    indexRef.current = (indexRef.current + 1) % faces.length;
    const run = ++runRef.current;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduced) {
      setIndex(indexRef.current);
      return;
    }

    void (async () => {
      await controls.start({
        scale: 1.1,
        transition: { duration: 0.1, ease: [0.22, 1, 0.36, 1] },
      });
      if (run !== runRef.current) return;
      await controls.start({
        scale: 1,
        transition: { duration: 0.12, ease: [0.4, 0, 0.2, 1] },
      });
      if (run !== runRef.current) return;
      flushSync(() => {
        setIndex(indexRef.current);
      });
    })();
  }

  const safeIndex = faces.length > 0 ? index % faces.length : 0;

  return (
    <button
      type="button"
      onClick={cycle}
      onMouseEnter={() => {
        setOver(true);
        setTip("ask");
      }}
      onMouseLeave={() => setOver(false)}
      data-sound="none"
      aria-label={`Эмоция ${safeIndex + 1} из ${faces.length}. Сменить`}
      aria-describedby={tipVisible ? tipId : undefined}
      className={`relative grid shrink-0 cursor-pointer touch-manipulation place-items-center overflow-visible border-0 bg-transparent p-0 ${size === 80 ? "size-20" : "size-[140px]"}`}
    >
      <span
        id={tipId}
        role="tooltip"
        aria-hidden={!tipVisible}
        className="pointer-events-none absolute top-[-24px] left-[calc(100%+8px)] z-10 flex items-start"
      >
        <motion.span
          aria-hidden
          className="block h-12 w-[10px] shrink-0 origin-[5px_45px] bg-surface-inverse"
          style={dotMask(POINT_1, 10)}
          initial={false}
          animate={
            tipVisible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }
          }
          transition={
            reduced || !tipVisible
              ? { duration: reduced ? 0 : 0.08 }
              : { type: "spring", stiffness: 640, damping: 18, mass: 0.35 }
          }
        />
        <motion.span
          aria-hidden
          className="block h-12 w-3 shrink-0 origin-[6px_34px] bg-surface-inverse"
          style={dotMask(POINT_2, 12)}
          initial={false}
          animate={
            tipVisible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }
          }
          transition={
            reduced || !tipVisible
              ? { duration: reduced ? 0 : 0.08 }
              : {
                  type: "spring",
                  stiffness: 640,
                  damping: 18,
                  mass: 0.35,
                  delay: 0.09,
                }
          }
        />
        <motion.span
          className="flex origin-bottom-left items-center justify-center whitespace-nowrap rounded-[24px] bg-surface-inverse px-3 py-1.5 text-center text-caption2 text-text-on-inverse"
          style={{ fontWeight: 500 }}
          initial={false}
          animate={
            tipVisible
              ? { opacity: 1, scale: 1 }
              : { opacity: 0, scale: 0.72 }
          }
          transition={
            reduced || !tipVisible
              ? { duration: reduced ? 0 : 0.1 }
              : {
                  type: "spring",
                  stiffness: 520,
                  damping: 12,
                  mass: 0.55,
                  delay: 0.18,
                }
          }
        >
          {tip === "ask" ? TIP_ASK : TIP_EW}
        </motion.span>
      </span>
      <motion.span
        animate={controls}
        initial={{ scale: 1 }}
        className="block size-full origin-center will-change-transform"
      >
        <Image
          src={publicPath(faces[safeIndex] ?? faces[0])}
          alt=""
          width={280}
          height={280}
          priority
          unoptimized
          draggable={false}
          className="pointer-events-none h-full w-full object-contain select-none"
        />
      </motion.span>
    </button>
  );
}
