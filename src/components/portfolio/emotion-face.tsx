"use client";

import { useSound } from "@/hooks/use-sound";
import { DEFAULT_FACES } from "@/lib/faces";
import { publicPath } from "@/lib/public-path";
import { motion, useAnimation } from "motion/react";
import Image from "next/image";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
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
 * Cutout portrait. Click swaps to the next file on the same frame, then
 * pulses that face to 110% and back to 100%.
 */
export function EmotionFace({ size = 140, faces: facesProp }: EmotionFaceProps) {
  const faces = facesProp && facesProp.length > 0 ? facesProp : DEFAULT_FACES;
  const faceKey = faces.join("|");
  const { play } = useSound();
  const tipId = useId();
  const tipRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const [index, setIndex] = useState(0);
  const [over, setOver] = useState(false);
  const [tip, setTip] = useState<TipPhase>("ask");
  const [bubbleMax, setBubbleMax] = useState<number | undefined>(undefined);
  // Null keeps the tip beside the portrait. A number parks it above, shifted
  // so a wrapped bubble stays inside the screen instead of covering the face.
  const [aboveShift, setAboveShift] = useState<number | null>(null);
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
      img.decode?.().catch(() => {});
    }
  }, [faceKey, faces]);

  // The tip hangs to the right of the portrait. On a phone that side is
  // narrower than the line, so the words wrap at the screen edge. If even one
  // word cannot fit there, the bubble moves above the face: sliding it left
  // would cover the portrait, and letting it stick out pans the page.
  useLayoutEffect(() => {
    const tip = tipRef.current;
    const bubble = bubbleRef.current;
    if (!tip || !bubble) return;

    const fit = () => {
      const button = tip.offsetParent;
      if (!(button instanceof HTMLElement)) return;
      const buttonRect = button.getBoundingClientRect();
      const limit = document.documentElement.clientWidth;
      const style = getComputedStyle(bubble);
      const padX =
        parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const probe = document.createElement("span");
      probe.style.position = "absolute";
      probe.style.visibility = "hidden";
      probe.style.whiteSpace = "nowrap";
      probe.style.font = style.font;
      probe.style.fontWeight = style.fontWeight;
      document.body.appendChild(probe);
      const words = (bubble.textContent ?? "").trim().split(/\s+/);
      let longest = 0;
      for (const word of words) {
        probe.textContent = word;
        longest = Math.max(longest, probe.offsetWidth);
      }
      probe.remove();
      const minBubble = Math.ceil(longest + padX);
      // Tail dots sit between the face and the label. 10px + 12px.
      const tail = 22;
      const gap = 8;
      const roomFor = (margin: number) =>
        Math.floor(limit - margin - buttonRect.right - gap - tail);
      const room =
        roomFor(16) >= minBubble ? roomFor(16) : roomFor(8);

      if (room >= minBubble) {
        setAboveShift((current) => (current === null ? current : null));
        setBubbleMax((current) => (current === room ? current : room));
        return;
      }

      const cap = Math.max(0, Math.floor(limit - 32));
      const prevMax = bubble.style.maxWidth;
      const prevWhite = bubble.style.whiteSpace;
      bubble.style.whiteSpace = "nowrap";
      bubble.style.maxWidth = "none";
      const line = bubble.offsetWidth;
      bubble.style.whiteSpace = prevWhite;
      bubble.style.maxWidth = prevMax;
      const bubbleWidth = Math.min(line, cap);
      const viewLeft = Math.max(
        16,
        Math.min((limit - bubbleWidth) / 2, limit - 16 - bubbleWidth),
      );
      const shift = Math.round(viewLeft - buttonRect.left);
      setAboveShift((current) => (current === shift ? current : shift));
      setBubbleMax((current) => (current === cap ? current : cap));
    };

    fit();
    window.addEventListener("resize", fit);
    let cancelled = false;
    document.fonts?.ready
      .then(() => {
        if (!cancelled) fit();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      window.removeEventListener("resize", fit);
    };
  }, [size, faceKey, tip]);

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

    // Swap before the pulse so the next portrait is on screen in this click,
    // not after the scale settles.
    flushSync(() => {
      setIndex(indexRef.current);
    });
    if (reduced) return;

    void (async () => {
      await controls.start({
        scale: 1.1,
        transition: { duration: 0.05, ease: [0.22, 1, 0.36, 1] },
      });
      if (run !== runRef.current) return;
      await controls.start({
        scale: 1,
        transition: { duration: 0.06, ease: [0.4, 0, 0.2, 1] },
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
        ref={tipRef}
        className={`face-tip pointer-events-none absolute z-10 flex items-start ${
          aboveShift === null
            ? "top-[-24px] left-[calc(100%+8px)]"
            : "bottom-[calc(100%+8px)]"
        }`}
        style={aboveShift === null ? undefined : { left: aboveShift }}
      >
        <motion.span
          aria-hidden
          className={`block h-12 w-[10px] shrink-0 origin-[5px_45px] bg-surface-inverse ${aboveShift === null ? "" : "hidden"}`}
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
          className={`block h-12 w-3 shrink-0 origin-[6px_34px] bg-surface-inverse ${aboveShift === null ? "" : "hidden"}`}
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
          ref={bubbleRef}
          className="block origin-bottom-left min-w-0 rounded-[24px] bg-surface-inverse px-3 py-1.5 text-center text-caption2 text-text-on-inverse"
          style={{ fontWeight: 500, width: "max-content", maxWidth: bubbleMax }}
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
      {size === 140 ? (
        // Home portrait only. Figma layer `light`: 60px circle, accent/primary,
        // layer blur 80. CSS blur is the Gaussian sigma, half the Figma radius.
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 size-[60px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-primary blur-[40px]"
        />
      ) : null}
      <motion.span
        animate={controls}
        initial={{ scale: 1 }}
        className="relative block size-full origin-center will-change-transform"
      >
        {faces.map((src, faceIndex) => (
          <Image
            key={`${faceIndex}:${src}`}
            src={publicPath(src)}
            alt=""
            width={280}
            height={280}
            priority={faceIndex === 0}
            loading="eager"
            unoptimized
            draggable={false}
            className={`pointer-events-none absolute inset-0 h-full w-full object-contain select-none ${
              faceIndex === safeIndex ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
      </motion.span>
    </button>
  );
}
