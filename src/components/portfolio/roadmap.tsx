"use client";

import { Bloub, useHeaderMood } from "@/components/portfolio/bloub";
import {
  CurvedArrow,
  ScrollArrow,
  TimelineDot,
} from "@/components/portfolio/decor-icons";
import {
  RoadmapCard,
  type RoadmapCardData,
} from "@/components/portfolio/roadmap-card";
import { cn } from "@/lib/utils";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

type Emotion = {
  id: string;
  label: string;
  state: string;
  expression?: string | null;
};

type RoadmapProps = {
  companies: RoadmapCardData[];
  projects: RoadmapCardData[];
  emotions: Emotion[];
  defaultEmotionId?: string;
};

type Row = {
  id: string;
  side: "left" | "right";
  card: RoadmapCardData;
  emotion: Emotion;
};

/** Figma Point Container: dot (24px) sits at pt-40 of each 240px row → center at 52px. */
const POINT_CENTER_PX = 52;
/** Travel marker (Phase B): bloub collapses into this dot and rides the connector. */
const TRAVEL_DOT_PX = 4;
/** Header → first point. Short on purpose: the bloub should be on the dot almost at once. */
const MORPH_MS = 220;
/** Within this many px of the document bottom the footer point counts as reached. */
const BOTTOM_REACH_PX = 48;

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

/** Both bends of the mobile entry connector are circular, radius 56. */
const ENTRY_RADIUS = 56;
const ENTRY_HEIGHT = ENTRY_RADIUS * 2;

/** Pixel path: turn under the bloub, straight run, turn down into the rail. */
function entryConnectorPath(width: number) {
  const r = Math.min(ENTRY_RADIUS, width / 2);
  const y0 = ENTRY_HEIGHT - r * 2;
  return `M ${width} ${y0} A ${r} ${r} 0 0 1 ${width - r} ${y0 + r} H ${r} A ${r} ${r} 0 0 0 0 ${y0 + r * 2}`;
}

/** Pixel path: leave the rail downward, straight run, turn down onto the centered dot. */
function exitConnectorPath(width: number) {
  const r = Math.min(ENTRY_RADIUS, width / 2);
  const y0 = ENTRY_HEIGHT - r * 2;
  return `M 0 ${y0} A ${r} ${r} 0 0 0 ${r} ${y0 + r} H ${width - r} A ${r} ${r} 0 0 1 ${width} ${y0 + r * 2}`;
}

function ColumnLabel({
  label,
  align,
}: {
  label: string;
  align: "left" | "right";
}) {
  // Figma card/content: label + curved arrow (mirrored on the right), py 24, gap 12
  return (
    <div
      className={cn(
        "flex items-start gap-3 py-6",
        align === "right" && "justify-end",
      )}
    >
      {align === "right" ? <CurvedArrow flip className="text-icon-muted" /> : null}
      <span className="text-caption1 text-text-muted">{label}</span>
      {align === "left" ? <CurvedArrow className="text-icon-muted" /> : null}
    </div>
  );
}

export function Roadmap({
  companies,
  projects,
  emotions,
  defaultEmotionId = "wave",
}: RoadmapProps) {
  const reducedMotion = usePrefersReducedMotion();
  const headerMood = useHeaderMood();
  const trackRef = useRef<HTMLDivElement>(null);
  const headerMarkerRef = useRef<HTMLDivElement>(null);
  // Points 0..rows.length-1 are card rows, index rows.length is the footer dot.
  const pointRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [hasScrolled, setHasScrolled] = useState(false);
  // Viewport below the desktop breakpoint: mobile/tablet roadmap (§3.2).
  const [narrow, setNarrow] = useState(false);
  // Phase A → B morph has finished: bloub may now sit on a point.
  const [morphDone, setMorphDone] = useState(false);
  // Sticky: once a card is revealed it stays revealed.
  const [revealedIndex, setRevealedIndex] = useState(-1);
  // Last point whose center crossed the 48% trigger (bloub arrive; follows scroll).
  // Dot color uses this too: accent only once the user has scrolled to the card.
  const [passedIndex, setPassedIndex] = useState(-1);
  // Distance from the idle bloub (header) to the first point: the morph target.
  // On mobile the first point is left of the centered bloub, so X is not zero.
  const [travelOffset, setTravelOffset] = useState({ x: 0, y: 0 });
  const rafRef = useRef(0);

  // Progress line + travel dot are driven outside React: `transform` written
  // straight to the DOM from a small smoothing loop. Re-rendering the whole
  // roadmap per scroll frame (and transitioning `height`/`top`) was the jank.
  const connectorRef = useRef<HTMLDivElement>(null);
  const fillLineRef = useRef<HTMLDivElement>(null);
  const travelDotRef = useRef<HTMLSpanElement>(null);
  const entrySvgRef = useRef<SVGSVGElement>(null);
  const entryTrackRef = useRef<SVGPathElement>(null);
  const entryFillRef = useRef<SVGPathElement>(null);
  const entryDotRef = useRef<HTMLSpanElement>(null);
  const exitSvgRef = useRef<SVGSVGElement>(null);
  const exitTrackRef = useRef<SVGPathElement>(null);
  const exitFillRef = useRef<SVGPathElement>(null);
  const exitDotRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef({
    target: 0,
    current: 0,
    // Journey head (48% trigger). The stroke may run ahead of it on mobile.
    dotTarget: 0,
    dotCurrent: 0,
    entryTarget: 0,
    entryCurrent: 0,
    exitTarget: 0,
    exitCurrent: 0,
    raf: 0,
    last: 0,
  });

  const emotionMap = useMemo(
    () => new Map(emotions.map((e) => [e.id, e])),
    [emotions],
  );

  const fallback = useMemo<Emotion>(
    () =>
      emotionMap.get(defaultEmotionId) ??
      emotions[0] ?? {
        id: "wave",
        label: "Wave",
        state: "wink",
      },
    [emotionMap, defaultEmotionId, emotions],
  );

  const rows: Row[] = useMemo(() => {
    const max = Math.max(companies.length, projects.length);
    const result: Row[] = [];
    for (let i = 0; i < max; i++) {
      if (companies[i]) {
        const card = companies[i];
        result.push({
          id: `company-${card.id}`,
          side: "left",
          card,
          emotion: emotionMap.get(card.bloubEmotion) ?? fallback,
        });
      }
      if (projects[i]) {
        const card = projects[i];
        result.push({
          id: `project-${card.id}`,
          side: "right",
          card,
          emotion: emotionMap.get(card.bloubEmotion) ?? fallback,
        });
      }
    }
    return result;
  }, [companies, projects, emotionMap, fallback]);

  const paintRef = useRef<
    (linePx: number, dotPx: number, entryT: number, exitT: number) => void
  >(() => {});

  useEffect(() => {
    document.documentElement.dataset.roadmap = "effect";
    const paintCurve = (
      svg: SVGSVGElement | null,
      track: SVGPathElement | null,
      fill: SVGPathElement | null,
      tip: HTMLSpanElement | null,
      t: number,
      pinStart = false,
    ) => {
      if (!svg || !track || !fill || !tip || svg.getClientRects().length === 0) {
        if (tip) tip.style.opacity = "0";
        return false;
      }
      const length = track.getTotalLength() || 1;
      const shown = length * t;
      fill.style.strokeDasharray = `${length} ${length}`;
      fill.style.strokeDashoffset = `${length - shown}`;
      const point = track.getPointAtLength(shown);
      const screen = new DOMPoint(point.x, point.y).matrixTransform(
        track.getScreenCTM() ?? new DOMMatrix(),
      );
      const box = svg.getBoundingClientRect();
      tip.style.transform = `translate(${screen.x - box.left}px, ${screen.y - box.top}px) translate(-50%, -50%)`;
      const onCurve = t > 0.02 && t < 0.98;
      // Mobile: once scrolling starts, the tip sits at the curve origin
      // before the stroke has moved (bloub lands there).
      const atStart = pinStart && t <= 0.02;
      tip.style.opacity = onCurve || atStart ? "1" : "0";
      return onCurve || atStart;
    };

    const paint = (linePx: number, dotPx: number, entryT: number, exitT: number) => {
      const connector = connectorRef.current;
      const line = fillLineRef.current;
      const dot = travelDotRef.current;
      if (!connector || !line || !dot) return;
      const lineHeight = connector.clientHeight || 1;
      // Compositor-only properties: no layout, no paint of the whole column.
      // `scale-y-0` is the CSS `scale` property (Tailwind 4), which multiplies
      // with `transform` and would keep the stroke at height 0. Clear it here.
      line.style.scale = "none";
      line.style.transform = `scaleY(${linePx / lineHeight})`;
      dot.style.transform = `translateY(${dotPx}px)`;

      const onEntry = paintCurve(
        entrySvgRef.current,
        entryTrackRef.current,
        entryFillRef.current,
        entryDotRef.current,
        entryT,
        window.scrollY > 20,
      );
      const onExit = paintCurve(
        exitSvgRef.current,
        exitTrackRef.current,
        exitFillRef.current,
        exitDotRef.current,
        exitT,
      );
      // The tip rides a curve while it is filling, otherwise the vertical line.
      // Hidden until the 48% line has actually entered the rail (dotPx > 0).
      dot.style.opacity = !onEntry && !onExit && dotPx > 0 && window.scrollY > 20 ? "1" : "0";
    };
    paintRef.current = paint;

    // Critically-damped follow: the line glides to the scroll position instead of
    // jumping with each wheel notch. τ = 70ms → settles in ~5 frames.
    const step = (ms: number) => {
      const p = progressRef.current;
      const dt = p.last ? Math.min((ms - p.last) / 1000, 0.064) : 1 / 60;
      p.last = ms;
      const k = reducedMotion ? 1 : 1 - Math.exp(-dt / 0.07);
      p.current += (p.target - p.current) * k;
      p.dotCurrent += (p.dotTarget - p.dotCurrent) * k;
      p.entryCurrent += (p.entryTarget - p.entryCurrent) * k;
      p.exitCurrent += (p.exitTarget - p.exitCurrent) * k;
      if (Math.abs(p.target - p.current) < 0.25) p.current = p.target;
      if (Math.abs(p.dotTarget - p.dotCurrent) < 0.25) p.dotCurrent = p.dotTarget;
      if (Math.abs(p.entryTarget - p.entryCurrent) < 0.004) {
        p.entryCurrent = p.entryTarget;
      }
      if (Math.abs(p.exitTarget - p.exitCurrent) < 0.004) {
        p.exitCurrent = p.exitTarget;
      }
      paint(p.current, p.dotCurrent, p.entryCurrent, p.exitCurrent);
      if (
        p.current !== p.target ||
        p.dotCurrent !== p.dotTarget ||
        p.entryCurrent !== p.entryTarget ||
        p.exitCurrent !== p.exitTarget
      ) {
        p.raf = requestAnimationFrame(step);
      } else {
        p.raf = 0;
        p.last = 0;
      }
    };

    const setTargets = (linePx: number, dotPx: number) => {
      const p = progressRef.current;
      p.target = linePx;
      p.dotTarget = dotPx;
      if (!p.raf) p.raf = requestAnimationFrame(step);
    };

    const update = () => {
      const track = trackRef.current;
      if (!track) return;

      const triggerY = window.innerHeight * 0.48;

      // The footer point may never reach the trigger line on short pages, so the
      // document bottom also counts as "reached" (Phase C).
      const atBottom =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - BOTTOM_REACH_PX;

      const connectorBox = connectorRef.current?.getBoundingClientRect();
      const lineHeight = connectorRef.current?.clientHeight ?? 0;
      const narrowNow = window.matchMedia("(max-width: 1159px)").matches;
      // Journey head: where the 48% line sits on the vertical rail.
      // Mobile uses the same head. The stroke must not run ahead of the travel
      // dot to the bottom of the viewport just because a card is already visible.
      const triggerFill = Math.max(
        0,
        Math.min(lineHeight, triggerY - (connectorBox?.top ?? triggerY)),
      );
      const linePx = atBottom ? lineHeight : triggerFill;
      const dotPx = linePx;
      const entry = entrySvgRef.current;
      const entryTrack = entryTrackRef.current;
      const entryFill = entryFillRef.current;
      if (entry && entryTrack && entryFill && entry.getClientRects().length > 0) {
        const width = entry.getBoundingClientRect().width;
        const d = entryConnectorPath(width);
        if (entryTrack.getAttribute("d") !== d) {
          entry.setAttribute("viewBox", `0 0 ${width} ${ENTRY_HEIGHT}`);
          entryTrack.setAttribute("d", d);
          entryFill.setAttribute("d", d);
        }
        const box = entry.getBoundingClientRect();
        const topDoc = box.top + window.scrollY;
        const endDoc = box.bottom + window.scrollY;
        const span = Math.max(1, endDoc - topDoc);
        // Where the 48% line sits on the curve at scroll 0. Anything already
        // past that line must still read as empty until the user scrolls.
        const resting = Math.max(0, Math.min(1, (triggerY - topDoc) / span));
        const along = Math.max(
          0,
          Math.min(1, (window.scrollY + triggerY - topDoc) / span),
        );
        let entryT = 0;
        if (window.scrollY > 0) {
          entryT =
            atBottom || resting >= 1
              ? 1
              : Math.max(0, Math.min(1, (along - resting) / (1 - resting)));
        }
        progressRef.current.entryTarget = entryT;
      } else {
        progressRef.current.entryTarget = 0;
      }
      const exit = exitSvgRef.current;
      const exitTrack = exitTrackRef.current;
      const exitFill = exitFillRef.current;
      if (exit && exitTrack && exitFill && exit.getClientRects().length > 0) {
        const width = exit.getBoundingClientRect().width;
        const d = exitConnectorPath(width);
        if (exitTrack.getAttribute("d") !== d) {
          exit.setAttribute("viewBox", `0 0 ${width} ${ENTRY_HEIGHT}`);
          exitTrack.setAttribute("d", d);
          exitFill.setAttribute("d", d);
        }
        const box = exit.getBoundingClientRect();
        const topDoc = box.top + window.scrollY;
        const endDoc = box.bottom + window.scrollY;
        const span = Math.max(1, endDoc - topDoc);
        const along = Math.max(
          0,
          Math.min(1, (window.scrollY + triggerY - topDoc) / span),
        );
        progressRef.current.exitTarget = atBottom ? 1 : along;
      } else {
        progressRef.current.exitTarget = 0;
      }
      document.documentElement.dataset.linePx = String(Math.round(linePx));
      document.documentElement.dataset.narrow = narrowNow ? "1" : "0";
      setTargets(linePx, dotPx);
      setNarrow((prev) => (prev === narrowNow ? prev : narrowNow));

      // Reversible: back at the top → bloub morphs back into the header (Phase A).
      setHasScrolled(window.scrollY > 20);

      const marker = headerMarkerRef.current;
      const firstPoint = pointRefs.current[0];
      // Mobile morph lands on the start of the entry curve, not the first card.
      if (marker && narrowNow && entryTrack && entry && entry.getClientRects().length > 0) {
        const start = entryTrack.getPointAtLength(0);
        const screen = new DOMPoint(start.x, start.y).matrixTransform(
          entryTrack.getScreenCTM() ?? new DOMMatrix(),
        );
        const m = marker.getBoundingClientRect();
        setTravelOffset({
          x: Math.round(screen.x - (m.left + m.width / 2)),
          y: Math.round(screen.y - (m.top + m.height / 2)),
        });
      } else if (marker && firstPoint) {
        const m = marker.getBoundingClientRect();
        const p = firstPoint.getBoundingClientRect();
        // Rounded so React can bail out: this only really changes on resize.
        setTravelOffset({
          x: Math.round(p.left + p.width / 2 - (m.left + m.width / 2)),
          y: Math.round(p.top + p.height / 2 - (m.top + m.height / 2)),
        });
      }

      let nextPassed = -1;
      // Dot color follows the journey (48% trigger), not mere visibility.
      // A point stays surface/points until its center crosses that line.
      pointRefs.current.forEach((el, index) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const pointCenter = rect.top + rect.height / 2;
        if (pointCenter <= triggerY) nextPassed = index;
      });
      if (atBottom) {
        nextPassed = pointRefs.current.length - 1;
      }

      setPassedIndex(nextPassed);
    };

    const onScrollOrResize = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(update);
    };

    try {
      update();
    } catch (error) {
      document.documentElement.dataset.roadmapErr =
        error instanceof Error ? error.stack ?? error.message : String(error);
    }
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      cancelAnimationFrame(rafRef.current);
      cancelAnimationFrame(progressRef.current.raf);
      progressRef.current.raf = 0;
      progressRef.current.last = 0;
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [rows.length, reducedMotion]);

  // React re-renders (lit dots, morph) must not wipe the transforms and dash
  // offsets this loop writes straight to the DOM.
  useLayoutEffect(() => {
    const p = progressRef.current;
    paintRef.current(p.current, p.dotCurrent, p.entryCurrent, p.exitCurrent);
  });

  // Phase A → B: the bloub needs MORPH_MS to reach the first point. Reversible.
  useEffect(() => {
    if (!hasScrolled) {
      setMorphDone(false);
      return;
    }
    if (reducedMotion) {
      setMorphDone(true);
      return;
    }
    const t = window.setTimeout(() => setMorphDone(true), MORPH_MS);
    return () => window.clearTimeout(t);
  }, [hasScrolled, reducedMotion]);

  // Phase C (Arrive): bloub sits on the last point the journey has reached.
  // Desktop morph lands on the first point, so index 0 is the floor once the
  // morph finishes. Mobile morph lands at the start of the entry curve; bloub
  // appears on a card only when that point is actually reached.
  const arrivedIndex =
    hasScrolled && morphDone
      ? narrow
        ? passedIndex
        : Math.max(0, passedIndex)
      : -1;

  // The card appears the moment bloub arrives on its point, and stays revealed.
  useEffect(() => {
    if (arrivedIndex < 0) return;
    const cardIndex = Math.min(arrivedIndex, rows.length - 1);
    setRevealedIndex((prev) => Math.max(prev, cardIndex));
  }, [arrivedIndex, rows.length]);

  // The point bloub just left: its dot shrinks back in instead of popping.
  const prevArrivedRef = useRef(-1);
  const [leftIndex, setLeftIndex] = useState(-1);
  useEffect(() => {
    const prev = prevArrivedRef.current;
    if (prev >= 0 && prev !== arrivedIndex) setLeftIndex(prev);
    prevArrivedRef.current = arrivedIndex;
  }, [arrivedIndex]);

  const currentEmotion = rows[arrivedIndex]?.emotion ?? fallback;
  const bloubAtFooter = arrivedIndex === rows.length;

  // Arrive: the dot grows into the bloub (scale .45 ≈ 20px dot → 44px bloub).
  const arriveClass = !reducedMotion
    ? "animate-[bloub-arrive_180ms_cubic-bezier(0.22,1,0.36,1)_both]"
    : undefined;
  const dotBackClass = (index: number) =>
    !reducedMotion && index === leftIndex
      ? "animate-[dot-back_360ms_cubic-bezier(0.22,1,0.36,1)_both]"
      : undefined;

  // Figma: «кейсы» sits in the right cell of the first content row
  // (next to the first company card). Fall back to the header if row 0 is a project.
  const casesLabelInHeader = rows.length === 0 || rows[0].side !== "left";

  return (
    <section
      className="relative mx-auto mt-12 w-full max-w-[1160px] px-4 min-[1160px]:mt-20"
      aria-label="Roadmap"
    >
      {/* Header RoadMap: 480 | 80 | 480, gap 48 (desktop). Mobile: centered bloub, no column labels. */}
      <header className="relative flex flex-col items-center pb-16 min-[1160px]:grid min-[1160px]:grid-cols-[minmax(0,1fr)_80px_minmax(0,1fr)] min-[1160px]:items-start min-[1160px]:gap-6 min-[1160px]:pb-0">
        <div className="hidden min-[1160px]:block">
          <ColumnLabel label="опыт работы" align="left" />
        </div>

        <div className="flex w-20 flex-col items-center gap-3">
          {/*
            Phase A → B: on first scroll the idle bloub shrinks into a 4px dot.
            Desktop: it slides to the first Point Container. Mobile: it lands
            at the start of the entry curve. The travel dot then takes over.
            Reversible when back at top.
          */}
          <div ref={headerMarkerRef} className="relative size-11">
            <div
              className="absolute inset-0"
              style={{
                transform: hasScrolled
                  ? `translate(${travelOffset.x}px, ${travelOffset.y}px) scale(${TRAVEL_DOT_PX / 44})`
                  : "none",
                opacity: hasScrolled ? 0 : 1,
                transition: hasScrolled
                  ? `transform ${MORPH_MS}ms cubic-bezier(0.22, 1, 0.36, 1), opacity 150ms ease ${MORPH_MS}ms`
                  : `transform ${MORPH_MS}ms cubic-bezier(0.22, 1, 0.36, 1), opacity 150ms ease`,
              }}
            >
              <Bloub
                phase="idle"
                // Header mascot cycles rest faces; card emotions are shown on Arrive.
                emotion={{
                  label: headerMood.label,
                  state: headerMood.state,
                  expression: headerMood.expression,
                }}
                reducedMotion={reducedMotion}
                // Invisible after the morph: don't burn a rAF loop on it.
                paused={hasScrolled}
                size={44}
                className={cn(
                  "absolute inset-0 transition-opacity duration-300",
                  hasScrolled && "opacity-0",
                )}
              />
              <span
                aria-hidden
                className={cn(
                  "absolute inset-0 rounded-full bg-accent-primary transition-opacity duration-300",
                  hasScrolled ? "opacity-100" : "opacity-0",
                )}
              />
            </div>
          </div>

          <div
            className={cn(
              "flex flex-col items-center gap-3 transition-opacity duration-300",
              hasScrolled && "pointer-events-none opacity-0",
              !hasScrolled && !reducedMotion && "bloub-idle-bob",
            )}
            aria-hidden={hasScrolled}
          >
            <p className="whitespace-nowrap text-center text-caption1 text-accent-primary">
              начинай скроллить
            </p>
            <ScrollArrow className="hidden text-accent-primary min-[1160px]:block" />
          </div>
        </div>

        <div className="hidden min-[1160px]:block">
          {casesLabelInHeader ? (
            <ColumnLabel label="кейсы" align="right" />
          ) : null}
        </div>
      </header>

      <div
        ref={trackRef}
        className="relative mx-auto w-full max-w-[480px] min-[1160px]:mt-8 min-[1160px]:max-w-none"
      >
        {/* Mobile: two-bend connector from the centered bloub onto the left rail. */}
        <div className="pointer-events-none absolute left-[14px] top-[52px] h-[112px] w-[calc(50%-14px)] -translate-y-full min-[1160px]:hidden">
          <svg
            ref={entrySvgRef}
            viewBox={`0 0 165 ${ENTRY_HEIGHT}`}
            fill="none"
            aria-hidden
            className="size-full overflow-visible text-border-default"
          >
            <path
              ref={entryTrackRef}
              d={entryConnectorPath(165)}
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="8 8"
            />
            <path
              ref={entryFillRef}
              d={entryConnectorPath(165)}
              stroke="var(--accent-primary)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="1000 1000"
              strokeDashoffset={1000}
            />
          </svg>
          <span
            ref={entryDotRef}
            className="absolute left-0 top-0 size-1 rounded-full bg-accent-primary opacity-0 shadow-[0_0_10px_2px_color-mix(in_srgb,var(--accent-primary)_70%,transparent)] will-change-transform"
          />
        </div>
        {/* decor/connector: 1px dashed line. Desktop: center axis. Mobile: left of the cards. */}
        <div
          ref={connectorRef}
          className="pointer-events-none absolute bottom-[132px] left-[14px] top-[52px] w-0 -translate-x-1/2 min-[1160px]:bottom-8 min-[1160px]:left-1/2"
          aria-hidden
        >
          {/* dash 8px / gap 8px — border-dashed can't set dash length, so a repeating gradient */}
          <div
            className="absolute inset-y-0 left-0 w-px -translate-x-1/2"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to bottom, var(--border-default) 0 8px, transparent 8px 16px)",
            }}
          />
          {/* Progress: full-height line scaled from the top (transform only, see effect) */}
          <div
            ref={fillLineRef}
            className="absolute inset-y-0 left-0 w-[2px] origin-top -translate-x-1/2 scale-y-0 rounded-full bg-accent-primary will-change-transform"
          />
          {/* Phase B (Travel): 4px dot, glow only — no ring — riding the end of the progress line */}
          <span
            ref={travelDotRef}
            className="absolute left-0 top-0 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-primary opacity-0 shadow-[0_0_10px_2px_color-mix(in_srgb,var(--accent-primary)_70%,transparent)] will-change-transform"
            style={{
              transition: reducedMotion
                ? "none"
                : hasScrolled
                  ? `opacity 150ms ease ${MORPH_MS}ms`
                  : "opacity 150ms ease",
            }}
          />
        </div>

        <div className="flex flex-col">
          {rows.map((row, index) => {
            const active = index <= revealedIndex;
            const showBloubHere = arrivedIndex === index;

            return (
              <div
                key={row.id}
                data-active={active ? "true" : "false"}
                data-bloub={showBloubHere ? "true" : "false"}
                // minmax(0,1fr): a skeleton's min-content must never push the center column off-axis
                className="relative grid min-h-[240px] grid-cols-[28px_minmax(0,1fr)] items-start gap-3 min-[1160px]:grid-cols-[minmax(0,1fr)_80px_minmax(0,1fr)] min-[1160px]:gap-6"
              >
                {/* Point Container: pt-40, 24px dot (or bloub on Arrive) */}
                <div className="relative z-[1] flex justify-center pt-10 min-[1160px]:col-start-2 min-[1160px]:row-start-1">
                  <span
                    ref={(el) => {
                      pointRefs.current[index] = el;
                    }}
                    className="relative flex size-6 items-center justify-center"
                  >
                    {showBloubHere ? (
                      <Bloub
                        phase="arrive"
                        emotion={currentEmotion}
                        reducedMotion={reducedMotion}
                        size={44}
                        className={cn("absolute", arriveClass)}
                      />
                    ) : (
                      <TimelineDot
                        // SDD §5.1: work → 20px, project → 10px
                        size={row.side === "left" ? 20 : 10}
                        className={cn(
                          "transition-colors duration-300",
                          dotBackClass(index),
                          // Follows the current scroll position (not sticky):
                          // surface/points until the 48% line reaches this card,
                          // scrolling back up turns passed dots grey again.
                          index <= passedIndex
                            ? "text-accent-primary"
                            : "text-surface-points",
                        )}
                      />
                    )}
                  </span>
                </div>

                <div
                  className={cn(
                    "py-4 min-[1160px]:row-start-1",
                    row.side === "left" ? "min-[1160px]:col-start-1" : "min-[1160px]:col-start-3",
                  )}
                >
                  <RoadmapCard
                    data={row.card}
                    active={active}
                    side={row.side}
                    reducedMotion={reducedMotion}
                  />
                </div>

                {index === 0 && !casesLabelInHeader ? (
                  <div className="hidden min-[1160px]:col-start-3 min-[1160px]:row-start-1 min-[1160px]:block">
                    <ColumnLabel label="кейсы" align="right" />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Footer: desktop dot sits on the center line. Mobile dot is centered; two bends bring the rail back to it. */}
        <footer className="relative h-[132px] min-[1160px]:h-[140px]">
          <div className="pointer-events-none absolute left-[14px] top-0 h-[112px] w-[calc(50%-14px)] min-[1160px]:hidden">
            <svg
              ref={exitSvgRef}
              viewBox={`0 0 165 ${ENTRY_HEIGHT}`}
              fill="none"
              aria-hidden
              className="size-full overflow-visible text-border-default"
            >
              <path
                ref={exitTrackRef}
                d={exitConnectorPath(165)}
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="8 8"
              />
              <path
                ref={exitFillRef}
                d={exitConnectorPath(165)}
                stroke="var(--accent-primary)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="1000 1000"
                strokeDashoffset={1000}
              />
            </svg>
            <span
              ref={exitDotRef}
              className="absolute left-0 top-0 size-1 rounded-full bg-accent-primary opacity-0 shadow-[0_0_10px_2px_color-mix(in_srgb,var(--accent-primary)_70%,transparent)] will-change-transform"
            />
          </div>
          <span
            ref={(el) => {
              pointRefs.current[rows.length] = el;
            }}
            data-bloub={bloubAtFooter ? "true" : "false"}
            className="absolute bottom-2 left-1/2 z-[1] flex size-6 -translate-x-1/2 items-center justify-center"
          >
            {bloubAtFooter ? (
              <Bloub
                phase="arrive"
                emotion={fallback}
                reducedMotion={reducedMotion}
                size={44}
                className={cn("absolute", arriveClass)}
              />
            ) : (
              <TimelineDot
                className={cn(
                  "transition-colors duration-300",
                  dotBackClass(rows.length),
                  passedIndex >= rows.length
                    ? "text-accent-primary"
                    : "text-surface-points",
                )}
              />
            )}
          </span>
          <p className="sr-only">Конец roadmap</p>
        </footer>
      </div>
    </section>
  );
}
