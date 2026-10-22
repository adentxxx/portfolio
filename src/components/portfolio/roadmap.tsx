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
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

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

/** 24px dot sits 52px from the row top so its center (~64px) lines up with the card avatar. */
const POINT_CENTER_PX = 64;
/** Travel marker (Phase B): bloub collapses into this dot and rides the connector. */
const TRAVEL_DOT_PX = 4;
/** Header decor/timeline-dot. Tablet morph lands here and stays (SDD §5.1). */
const ORIGIN_DOT_PX = 20;
/** Phone (<768, Figma 161:559): footer and work dots, and the morph landing dot. */
const PHONE_DOT_PX = 16;
/** Phone project decor/timeline-dot. Desktop/tablet stays 10. */
const PHONE_PROJECT_DOT_PX = 8;
/** Header → first point. Short on purpose: the bloub should be on the dot almost at once. */
const MORPH_MS = 220;
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

/**
 * Dashed bends before the box width is known. A fixed viewBox letterboxes
 * (default preserveAspectRatio) and the tail misses the rail until JS
 * measures — on a slow load that sat wrong for seconds. These arcs are
 * pinned to the box edges, so the curve meets the rail on the first paint.
 * Radius stays 56, and shrinks only when the box is narrower than 112.
 */
const CONNECTOR_ARC = "min(56px, 50cqw)";

function DashArc({
  d,
  className,
  style,
}: {
  d: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox={`0 0 ${ENTRY_RADIUS} ${ENTRY_RADIUS}`}
      fill="none"
      aria-hidden
      className={cn("absolute overflow-visible text-border-default", className)}
      style={{ width: CONNECTOR_ARC, height: CONNECTOR_ARC, ...style }}
    >
      <path
        d={d}
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="8 8"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function ConnectorDashFallback({ side }: { side: "entry" | "exit" }) {
  const entry = side === "entry";
  const r = ENTRY_RADIUS;
  return (
    <>
      <span
        aria-hidden
        className="absolute -translate-y-1/2"
        style={{
          left: `calc(${CONNECTOR_ARC} - 1px)`,
          right: `calc(${CONNECTOR_ARC} - 1px)`,
          top: `calc(100% - ${CONNECTOR_ARC})`,
          height: 1,
          backgroundImage: entry
            ? "repeating-linear-gradient(to left, transparent 0 8px, var(--border-default) 8px 16px)"
            : "repeating-linear-gradient(to right, transparent 0 8px, var(--border-default) 8px 16px)",
        }}
      />
      <DashArc
        d={
          entry
            ? `M ${r} 0 A ${r} ${r} 0 0 1 0 ${r}`
            : `M 0 0 A ${r} ${r} 0 0 0 ${r} ${r}`
        }
        className={entry ? "right-0" : "left-0"}
        style={{ top: `calc(100% - 2 * ${CONNECTOR_ARC})` }}
      />
      <DashArc
        d={
          entry
            ? `M ${r} 0 A ${r} ${r} 0 0 0 0 ${r}`
            : `M 0 0 A ${r} ${r} 0 0 1 ${r} ${r}`
        }
        className={entry ? "bottom-0 left-0" : "right-0 bottom-0"}
      />
    </>
  );
}

/** Bloub diameter on a point. The dot scales up to this and back. */
const BLOUB_ON_DOT_PX = 44;
/** Phone header and arrived bloub (Figma 161:820). */
const PHONE_BLOUB_PX = 40;
/** Appear / disappear between decor/timeline-dot and bloub. */
const DOT_BLOUB_MS = 200;

/**
 * Keeps the bloub mounted through the exit so opacity and scale can ease
 * back into the dot. `shown` flips a frame after mount, so the 200ms
 * transition has a real start state.
 */
function useDotBloubPresence(show: boolean, reducedMotion: boolean) {
  const [mounted, setMounted] = useState(show);
  const [shown, setShown] = useState(show);

  useLayoutEffect(() => {
    if (reducedMotion) {
      setMounted(show);
      setShown(show);
      return;
    }
    if (show) setMounted(true);
    else setShown(false);
  }, [show, reducedMotion]);

  useEffect(() => {
    if (reducedMotion || !show || !mounted) return;
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [show, mounted, reducedMotion]);

  useEffect(() => {
    if (reducedMotion || show) return;
    const id = window.setTimeout(() => setMounted(false), DOT_BLOUB_MS);
    return () => window.clearTimeout(id);
  }, [show, reducedMotion]);

  return { mounted, shown };
}

function TimelineMarker({
  showBloub,
  emotion,
  reducedMotion,
  dotSize = 20,
  bloubSize = BLOUB_ON_DOT_PX,
  lit,
}: {
  showBloub: boolean;
  emotion: Emotion;
  reducedMotion: boolean;
  dotSize?: number;
  bloubSize?: number;
  lit: boolean;
}) {
  const { mounted, shown } = useDotBloubPresence(showBloub, reducedMotion);
  // 8px of page color around the dot. Above the dashed connector (the gap),
  // below the progress line, so the orange stroke is not cut or lit by it.
  const plate = dotSize + 16;

  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 z-[1] -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface-page"
        style={{ width: plate, height: plate }}
      />
      <TimelineDot
        size={dotSize}
        className={cn(
          "timeline-marker-dot relative z-[3]",
          shown ? "opacity-0" : "opacity-100",
          lit ? "text-accent-primary" : "text-surface-points",
        )}
      />
      {mounted ? (
        <span
          className="timeline-marker-bloub absolute z-[3]"
          style={{
            opacity: shown ? 1 : 0,
            transform: shown
              ? "scale(1)"
              : `scale(${dotSize / bloubSize})`,
          }}
        >
          <Bloub
            phase="arrive"
            emotion={emotion}
            reducedMotion={reducedMotion}
            size={bloubSize}
          />
        </span>
      ) : null}
    </>
  );
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
  // Phone frame (Figma 161:559). Tablet keeps the 44px bloub and 20/10 dots.
  const [phone, setPhone] = useState(false);
  useLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setPhone(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  // Measure before paint, and again if the box changes (scrollbar, rotation).
  // Waiting for the scroll effect left the tail on the SSR viewBox for seconds.
  useLayoutEffect(() => {
    const read = (el: HTMLElement | null) => {
      if (!el || el.getClientRects().length === 0) return 0;
      return el.getBoundingClientRect().width;
    };
    const apply = () => {
      const w = read(entryBoxRef.current) || read(exitBoxRef.current);
      const next = w > 0 ? Math.round(w * 100) / 100 : null;
      setCurveWidth((prev) => (prev === next ? prev : next));
    };
    apply();
    const ro = new ResizeObserver(apply);
    if (entryBoxRef.current) ro.observe(entryBoxRef.current);
    if (exitBoxRef.current) ro.observe(exitBoxRef.current);
    return () => ro.disconnect();
  }, []);
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
  // Mobile: the timeline-dot born at the connector origin is accent once the
  // 48% trigger has passed its center, grey again on the way back up.
  const [entryOriginLit, setEntryOriginLit] = useState(false);
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
  const entryBoxRef = useRef<HTMLDivElement>(null);
  const exitSvgRef = useRef<SVGSVGElement>(null);
  const exitTrackRef = useRef<SVGPathElement>(null);
  const exitFillRef = useRef<SVGPathElement>(null);
  const exitDotRef = useRef<HTMLSpanElement>(null);
  const exitBoxRef = useRef<HTMLDivElement>(null);
  // Null until the entry/exit box is measured. The dashed fallback doesn't
  // need it; the single path (and the scroll fill) does.
  const [curveWidth, setCurveWidth] = useState<number | null>(null);
  const updateRef = useRef<() => void>(() => {});
  const progressRef = useRef({
    // Unclamped head, px from the top of the vertical rail. The tail is the
    // part past `lineHeight`, so both pieces share one smoothed value.
    target: 0,
    current: 0,
    lineHeight: 1,
    exitSpan: 0,
    exitLength: 0,
    dotCurrent: 0,
    entryTarget: 0,
    entryCurrent: 0,
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
      edge = 0.02,
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
      const onCurve = t > edge && t < 0.98;
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
        // The origin keeps its own timeline-dot. The travel tip only shows
        // once it has moved off that dot.
        false,
      );
      paintCurve(
        exitSvgRef.current,
        exitTrackRef.current,
        exitFillRef.current,
        exitDotRef.current,
        exitT,
        false,
        0,
      );
      // One head feeds both pieces, and the marker swaps in the same frame:
      // the rail dot has a 150ms opacity fade for the header morph, which would
      // leave it on the joint while the tail tip is already moving.
      const onTail = exitT > 0;
      if (onTail) dot.style.transition = "none";
      dot.style.opacity =
        !onEntry && !onTail && dotPx > 0 && window.scrollY > 20 ? "1" : "0";
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
      p.entryCurrent += (p.entryTarget - p.entryCurrent) * k;
      if (Math.abs(p.target - p.current) < 0.25) p.current = p.target;
      if (Math.abs(p.entryTarget - p.entryCurrent) < 0.004) {
        p.entryCurrent = p.entryTarget;
      }
      const rail = p.lineHeight || 1;
      const linePx = Math.max(0, Math.min(rail, p.current));
      // Path length is longer than the tail's height, so a linear fraction
      // launches the tip at ~2× the rail speed. Ease it so the first pixel
      // of the curve moves 1:1 with the rail, and still finishes at the end.
      const overflow = Math.max(0, p.current - rail);
      const span = p.exitSpan;
      const length = p.exitLength || span;
      let exitT = 0;
      if (span > 0 && length > 0 && overflow > 0) {
        const x = Math.min(span, overflow);
        const shown = x + (length / span - 1) * ((x * x) / span);
        exitT = Math.min(1, shown / length);
      }
      p.dotCurrent = linePx;
      p.exitCurrent = exitT;
      paint(linePx, linePx, p.entryCurrent, exitT);
      if (
        p.current !== p.target ||
        p.entryCurrent !== p.entryTarget
      ) {
        p.raf = requestAnimationFrame(step);
      } else {
        p.raf = 0;
        p.last = 0;
      }
    };

    const setTargets = (journeyPx: number) => {
      const p = progressRef.current;
      p.target = journeyPx;
      if (!p.raf) p.raf = requestAnimationFrame(step);
    };

    const update = () => {
      const track = trackRef.current;
      if (!track) return;

      const triggerY = window.innerHeight * 0.48;
      const maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );

      const connectorBox = connectorRef.current?.getBoundingClientRect();
      const lineHeight = connectorRef.current?.clientHeight ?? 0;
      const narrowNow = window.matchMedia("(max-width: 1159px)").matches;
      const phoneNow = window.matchMedia("(max-width: 767px)").matches;

      // Journey head, in document px. Normally the 48% line. On a short page the
      // footer dot never reaches that line, and snapping to it at the bottom
      // jumps the stroke and the bloub. From the last card onward, stretch the
      // remaining distance across the scroll that is actually left.
      let headDoc = window.scrollY + triggerY;
      const footerEl = pointRefs.current[rows.length];
      const lastEl = rows.length > 0 ? pointRefs.current[rows.length - 1] : null;
      if (footerEl && lastEl) {
        const centerDoc = (el: HTMLElement) => {
          const rect = el.getBoundingClientRect();
          return rect.top + rect.height / 2 + window.scrollY;
        };
        const footerDoc = centerDoc(footerEl);
        const lastDoc = centerDoc(lastEl);
        const yLast = lastDoc - triggerY;
        const yFooter = footerDoc - triggerY;
        if (yFooter > maxScroll && maxScroll > yLast + 1 && window.scrollY >= yLast) {
          const t = Math.min(1, (window.scrollY - yLast) / (maxScroll - yLast));
          headDoc = lastDoc + t * (footerDoc - lastDoc);
        }
      }

      const connectorTopDoc = (connectorBox?.top ?? 0) + window.scrollY;
      // Unclamped: pixels past the rail belong to the tail and are smoothed
      // together with the rail, so the handoff cannot lead or lag.
      const journeyPx = headDoc - connectorTopDoc;
      const entry = entrySvgRef.current;
      const entryTrack = entryTrackRef.current;
      const entryFill = entryFillRef.current;
      if (entry && entryTrack && entryFill && entry.getClientRects().length > 0) {
        const width = entry.getBoundingClientRect().width;
        const d = entryConnectorPath(width);
        if (entryTrack.getAttribute("d") !== d) {
          const viewBox = `0 0 ${width} ${ENTRY_HEIGHT}`;
          entry.setAttribute("viewBox", viewBox);
          entryFill.ownerSVGElement?.setAttribute("viewBox", viewBox);
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
            resting >= 1
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
          const viewBox = `0 0 ${width} ${ENTRY_HEIGHT}`;
          exit.setAttribute("viewBox", viewBox);
          exitFill.ownerSVGElement?.setAttribute("viewBox", viewBox);
          exitTrack.setAttribute("d", d);
          exitFill.setAttribute("d", d);
        }
        const box = exit.getBoundingClientRect();
        progressRef.current.exitSpan = Math.max(1, box.height);
        progressRef.current.exitLength = exitTrack.getTotalLength() || box.height;
      } else {
        progressRef.current.exitSpan = 0;
        progressRef.current.exitLength = 0;
      }
      progressRef.current.lineHeight = lineHeight || 1;
      document.documentElement.dataset.linePx = String(Math.round(Math.max(0, journeyPx)));
      document.documentElement.dataset.narrow = narrowNow ? "1" : "0";
      setTargets(journeyPx);
      setNarrow((prev) => (prev === narrowNow ? prev : narrowNow));
      setPhone((prev) => (prev === phoneNow ? prev : phoneNow));

      // Reversible: back at the top → bloub morphs back into the header (Phase A).
      setHasScrolled(window.scrollY > 20);

      const marker = headerMarkerRef.current;
      const firstPoint = pointRefs.current[0];
      // Mobile morph lands on the start of the entry curve, not the first card.
      // That dot stays there; the 4px tip keeps riding the connector.
      let originLit = false;
      if (marker && narrowNow && entryTrack && entry && entry.getClientRects().length > 0) {
        const start = entryTrack.getPointAtLength(0);
        const screen = new DOMPoint(start.x, start.y).matrixTransform(
          entryTrack.getScreenCTM() ?? new DOMMatrix(),
        );
        originLit = screen.y + window.scrollY <= headDoc + 0.5;
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
      setEntryOriginLit((prev) => (prev === originLit ? prev : originLit));

      let nextPassed = -1;
      // Dot color follows the journey head, not mere visibility.
      // A point stays surface/points until the head reaches its center.
      pointRefs.current.forEach((el, index) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const pointDoc = rect.top + rect.height / 2 + window.scrollY;
        if (pointDoc <= headDoc + 0.5) nextPassed = index;
      });

      setPassedIndex(nextPassed);
    };

    const onScrollOrResize = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(update);
    };

    updateRef.current = update;
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

  // Width lands in a layout effect, after the scroll listener is attached.
  // Re-read geometry so a reload mid-page fills the curve that just mounted.
  useLayoutEffect(() => {
    updateRef.current();
  }, [curveWidth]);

  // React re-renders (lit dots, morph) must not wipe the transforms and dash
  // offsets this loop writes straight to the DOM.
  useLayoutEffect(() => {
    const p = progressRef.current;
    // `current` is the unclamped journey. The rail stroke must stay clamped;
    // passing `current` through would scale it past the joint for a frame.
    paintRef.current(p.dotCurrent, p.dotCurrent, p.entryCurrent, p.exitCurrent);
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

  const bloubAtFooter = arrivedIndex === rows.length;

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
            Phase A → B: on first scroll the idle bloub shrinks into a dot.
            Desktop: 4px, slides to the first Point Container, then the travel
            tip takes over. Narrow: a timeline-dot (phone 16px, tablet 20px)
            stays at the start of the entry curve while the tip keeps riding.
            Back at the top, the dot grows into the bloub again.
          */}
          <div
            ref={headerMarkerRef}
            className={cn(
              "relative",
              phone ? "size-10" : "size-11",
              hasScrolled && narrow && "z-10",
            )}
          >
            <div
              className="absolute inset-0"
              style={{
                transform: hasScrolled
                  ? `translate(${travelOffset.x}px, ${travelOffset.y}px) scale(${(narrow ? (phone ? PHONE_DOT_PX : ORIGIN_DOT_PX) : TRAVEL_DOT_PX) / (phone ? PHONE_BLOUB_PX : BLOUB_ON_DOT_PX)})`
                  : "none",
                opacity: hasScrolled && !narrow ? 0 : 1,
                transition: reducedMotion
                  ? "none"
                  : hasScrolled
                    ? `transform ${MORPH_MS}ms cubic-bezier(0.22, 1, 0.36, 1), opacity 150ms ease ${narrow ? "0ms" : `${MORPH_MS}ms`}`
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
                size={phone ? PHONE_BLOUB_PX : BLOUB_ON_DOT_PX}
                className={cn(
                  "absolute inset-0 transition-opacity duration-300",
                  hasScrolled && "opacity-0",
                )}
              />
              <span
                aria-hidden
                className={cn(
                  "absolute inset-0 rounded-full transition-[opacity,background-color] duration-300",
                  hasScrolled ? "opacity-100" : "opacity-0",
                  narrow && !entryOriginLit
                    ? "bg-surface-points"
                    : "bg-accent-primary",
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
        {/* Mobile: two-bend connector from the centered bloub onto the left rail.
            The shift creates a stacking context, so the orange stroke lives in
            its own layer above the page plates. Until `curveWidth` is measured
            the dashes are edge-pinned; the single path replaces them in the
            same geometry before the browser paints. */}
        <div
          ref={entryBoxRef}
          className="pointer-events-none absolute left-[14px] top-[52px] h-[112px] w-[calc(50%-14px)] -translate-y-full min-[1160px]:hidden"
          style={{ containerType: "inline-size" }}
        >
          {curveWidth ? (
            <svg
              ref={entrySvgRef}
              viewBox={`0 0 ${curveWidth} ${ENTRY_HEIGHT}`}
              fill="none"
              aria-hidden
              className="size-full overflow-visible text-border-default"
            >
              <path
                ref={entryTrackRef}
                d={entryConnectorPath(curveWidth)}
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="8 8"
              />
            </svg>
          ) : (
            <ConnectorDashFallback side="entry" />
          )}
        </div>
        <div className="pointer-events-none absolute left-[14px] top-[52px] z-[2] h-[112px] w-[calc(50%-14px)] -translate-y-full min-[1160px]:hidden">
          <svg
            viewBox={`0 0 ${curveWidth ?? 1} ${ENTRY_HEIGHT}`}
            fill="none"
            aria-hidden
            className="size-full overflow-visible"
          >
            <path
              ref={entryFillRef}
              d={entryConnectorPath(curveWidth ?? 1)}
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
        {/* decor/connector: 1px dashed line. Desktop: center axis. Mobile: left of the cards.
            The centering shift is its own stacking context, so the progress
            stroke is a sibling layer: above the page plates, below the dots. */}
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
        </div>
        <div
          className="pointer-events-none absolute bottom-[132px] left-[14px] top-[52px] z-[2] w-0 -translate-x-1/2 min-[1160px]:bottom-8 min-[1160px]:left-1/2"
          aria-hidden
        >
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

        {/*
          Mobile (<1160): 32px between cards, and 32px from a card to the
          straight run of a curved connector. That run is one radius (56px)
          off the rail. The rail starts at 52px, so the entry run is 4px above
          the track and the first card begins at 28px. The exit rail stops
          24px above the last card, so its run sits 32px below the card.
        */}
        <div className="flex flex-col gap-8 pt-[28px] min-[1160px]:gap-0 min-[1160px]:pt-0">
          {rows.map((row, index) => {
            const active = index <= revealedIndex;
            const showBloubHere = arrivedIndex === index;

            return (
              <div
                key={row.id}
                data-active={active ? "true" : "false"}
                data-bloub={showBloubHere ? "true" : "false"}
                // minmax(0,1fr): a skeleton's min-content must never push the center column off-axis
                className="relative grid grid-cols-[28px_minmax(0,1fr)] items-start gap-3 min-[1160px]:min-h-[240px] min-[1160px]:grid-cols-[minmax(0,1fr)_80px_minmax(0,1fr)] min-[1160px]:gap-6"
              >
                {/* Point Container: 24px box, level with the card avatar.
                    Desktop card column has py-4, so the box sits at 52px.
                    Phone and tablet: 36px from the top of the row.
                    No z-index here: the plate and the dot set their own layers. */}
                <div className="relative flex justify-center pt-[36px] min-[1160px]:col-start-2 min-[1160px]:row-start-1 min-[1160px]:pt-[52px]">
                  <span
                    ref={(el) => {
                      pointRefs.current[index] = el;
                    }}
                    className="relative flex size-6 items-center justify-center"
                  >
                    <TimelineMarker
                      showBloub={showBloubHere}
                      emotion={row.emotion}
                      reducedMotion={reducedMotion}
                      bloubSize={phone ? PHONE_BLOUB_PX : BLOUB_ON_DOT_PX}
                      // Work 20 / project 10. Phone (Figma 161:559): 16 / 8.
                      dotSize={
                        row.side === "left"
                          ? phone
                            ? PHONE_DOT_PX
                            : 20
                          : phone
                            ? PHONE_PROJECT_DOT_PX
                            : 10
                      }
                      // Follows the current scroll position (not sticky):
                      // surface/points until the 48% line reaches this card,
                      // scrolling back up turns passed dots grey again.
                      lit={index <= passedIndex}
                    />
                  </span>
                </div>

                <div
                  className={cn(
                    "min-[1160px]:row-start-1 min-[1160px]:py-4",
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
        <footer className="relative h-[108px] min-[1160px]:h-[140px]">
          <div
            ref={exitBoxRef}
            className="pointer-events-none absolute -top-6 left-[14px] h-[112px] w-[calc(50%-14px)] min-[1160px]:hidden"
            style={{ containerType: "inline-size" }}
          >
            {curveWidth ? (
              <svg
                ref={exitSvgRef}
                viewBox={`0 0 ${curveWidth} ${ENTRY_HEIGHT}`}
                fill="none"
                aria-hidden
                className="size-full overflow-visible text-border-default"
              >
                <path
                  ref={exitTrackRef}
                  d={exitConnectorPath(curveWidth)}
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="8 8"
                />
              </svg>
            ) : (
              <ConnectorDashFallback side="exit" />
            )}
            <svg
              viewBox={`0 0 ${curveWidth ?? 1} ${ENTRY_HEIGHT}`}
              fill="none"
              aria-hidden
              className="pointer-events-none absolute inset-0 z-[2] size-full overflow-visible"
            >
              <path
                ref={exitFillRef}
                d={exitConnectorPath(curveWidth ?? 1)}
                stroke="var(--accent-primary)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="1000 1000"
                strokeDashoffset={1000}
              />
            </svg>
            <span
              ref={exitDotRef}
              className="absolute left-0 top-0 z-[2] size-1 rounded-full bg-accent-primary opacity-0 shadow-[0_0_10px_2px_color-mix(in_srgb,var(--accent-primary)_70%,transparent)] will-change-transform"
            />
          </div>
          <span
            ref={(el) => {
              pointRefs.current[rows.length] = el;
            }}
            data-bloub={bloubAtFooter ? "true" : "false"}
            className="absolute bottom-2 left-1/2 flex size-6 -translate-x-1/2 items-center justify-center"
          >
            <TimelineMarker
              showBloub={bloubAtFooter}
              emotion={fallback}
              reducedMotion={reducedMotion}
              bloubSize={phone ? PHONE_BLOUB_PX : BLOUB_ON_DOT_PX}
              dotSize={phone ? PHONE_DOT_PX : 20}
              lit={passedIndex >= rows.length}
            />
          </span>
          <p className="sr-only">Конец roadmap</p>
        </footer>
      </div>
    </section>
  );
}
