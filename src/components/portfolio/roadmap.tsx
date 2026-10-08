"use client";

import { Bloub } from "@/components/portfolio/bloub";
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
import { useEffect, useMemo, useRef, useState } from "react";

type Emotion = {
  id: string;
  label: string;
  assetSrc: string;
  idleAnimation?: string | null;
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

const SNAP_PX = 36;
/** Figma Point Container: dot (24px) sits at pt-40 of each 240px row → center at 52px. */
const POINT_CENTER_PX = 52;
/** Travel marker (Phase B): bloub collapses into this dot and rides the connector. */
const TRAVEL_DOT_PX = 8;
const MORPH_MS = 600;

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
  const trackRef = useRef<HTMLDivElement>(null);
  const headerMarkerRef = useRef<HTMLDivElement>(null);
  const pointRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const revealedRef = useRef(-1);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [revealedIndex, setRevealedIndex] = useState(-1);
  const [passedIndex, setPassedIndex] = useState(-1);
  const [atPointIndex, setAtPointIndex] = useState(-1);
  const [fillPx, setFillPx] = useState(0);
  // Distance from the idle bloub (header) to the first point: the morph target.
  const [travelOffset, setTravelOffset] = useState(0);
  const rafRef = useRef(0);

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
        assetSrc: "/bloub/wave.svg",
        idleAnimation: "bob",
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

  useEffect(() => {
    const update = () => {
      const track = trackRef.current;
      if (!track) return;

      const trackRect = track.getBoundingClientRect();
      const triggerY = window.innerHeight * 0.48;
      const scrolledPastTop = triggerY - trackRect.top;
      const height = trackRect.height;

      setFillPx(Math.max(0, Math.min(height, scrolledPastTop)));

      // Reversible: back at the top → bloub morphs back into the header (Phase A).
      setHasScrolled(window.scrollY > 20);

      const marker = headerMarkerRef.current;
      const firstPoint = pointRefs.current[0];
      if (marker && firstPoint) {
        const m = marker.getBoundingClientRect();
        const p = firstPoint.getBoundingClientRect();
        setTravelOffset(p.top + p.height / 2 - (m.top + m.height / 2));
      }

      let nextPassed = -1;
      let nextAt = -1;
      let bestDist = Number.POSITIVE_INFINITY;

      pointRefs.current.forEach((el, index) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const pointCenter = rect.top + rect.height / 2;
        if (pointCenter <= triggerY) nextPassed = index;
        const dist = Math.abs(pointCenter - triggerY);
        if (dist < bestDist) {
          bestDist = dist;
          nextAt = index;
        }
      });

      if (bestDist > SNAP_PX) nextAt = -1;

      // Reveal the card at the same moment bloub snaps onto its point.
      const candidate = Math.max(nextPassed, nextAt);
      if (candidate > revealedRef.current) {
        revealedRef.current = candidate;
      }

      setAtPointIndex(nextAt);
      setPassedIndex(nextPassed);
      setRevealedIndex(revealedRef.current);
    };

    const onScrollOrResize = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [rows.length]);

  const currentEmotion =
    atPointIndex >= 0
      ? (rows[atPointIndex]?.emotion ?? fallback)
      : fallback;

  // Figma: «кейсы» sits in the right cell of the first content row
  // (next to the first company card). Fall back to the header if row 0 is a project.
  const casesLabelInHeader = rows.length === 0 || rows[0].side !== "left";

  return (
    <section
      className="relative mx-auto mt-20 w-full max-w-[1160px] px-4"
      aria-label="Roadmap"
    >
      {/* Header RoadMap: 480 | 80 | 480, gap 48 (desktop); stacked on mobile */}
      <header className="flex flex-col items-center md:grid md:grid-cols-[1fr_80px_1fr] md:items-start md:gap-6">
        <div className="hidden md:block">
          <ColumnLabel label="опыт работы" align="left" />
        </div>

        <div className="flex w-20 flex-col items-center gap-3">
          {/*
            Phase A → B: on first scroll the idle bloub shrinks into an 8px dot
            (44 × 8/44) and slides down to the first Point Container, then the
            travel dot on the connector takes over. Reversible when back at top.
          */}
          <div ref={headerMarkerRef} className="relative size-11">
            <div
              className="absolute inset-0"
              style={{
                transform: hasScrolled
                  ? `translateY(${travelOffset}px) scale(${TRAVEL_DOT_PX / 44})`
                  : "none",
                opacity: hasScrolled ? 0 : 1,
                transition: hasScrolled
                  ? `transform ${MORPH_MS}ms cubic-bezier(0.22, 1, 0.36, 1), opacity 150ms ease ${MORPH_MS}ms`
                  : `transform ${MORPH_MS}ms cubic-bezier(0.22, 1, 0.36, 1), opacity 150ms ease`,
              }}
            >
              <Bloub
                phase={reducedMotion ? "arrive" : "idle"}
                emotionSrc={fallback.assetSrc}
                emotionLabel={fallback.label}
                idleAnimation={
                  reducedMotion || hasScrolled ? null : fallback.idleAnimation
                }
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
            )}
            aria-hidden={hasScrolled}
          >
            <p className="whitespace-nowrap text-center text-caption1 text-accent-primary">
              начинай скроллить
            </p>
            <ScrollArrow
              className={cn(
                "text-accent-primary",
                !hasScrolled && !reducedMotion && "bloub-idle-bob",
              )}
            />
          </div>
        </div>

        <div className="hidden md:block">
          {casesLabelInHeader ? (
            <ColumnLabel label="кейсы" align="right" />
          ) : null}
        </div>
      </header>

      <div ref={trackRef} className="relative mt-6 md:mt-8">
        {/* decor/connector: 1px dashed line from the first point to the footer dot */}
        <div
          className="pointer-events-none absolute bottom-8 left-[14px] top-[52px] w-0 -translate-x-1/2 md:left-1/2"
          aria-hidden
        >
          <div className="absolute inset-y-0 left-0 w-0 border-l border-dashed border-border-default" />
          <div
            className="absolute left-0 top-0 max-h-full w-[2px] -translate-x-1/2 rounded-full bg-accent-primary"
            style={{
              height: Math.max(0, fillPx - POINT_CENTER_PX),
              transition: reducedMotion ? "none" : "height 80ms linear",
            }}
          />
          {/* Phase B (Travel): 8px dot riding the end of the progress line */}
          <span
            className="absolute left-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-primary"
            style={{
              top: `min(${Math.max(0, fillPx - POINT_CENTER_PX)}px, 100%)`,
              opacity: hasScrolled ? 1 : 0,
              transition: reducedMotion
                ? "none"
                : hasScrolled
                  ? `top 80ms linear, opacity 150ms ease ${MORPH_MS}ms`
                  : "top 80ms linear, opacity 150ms ease",
            }}
          />
        </div>

        <div className="flex flex-col">
          {rows.map((row, index) => {
            const active = index <= revealedIndex;
            const showBloubHere = atPointIndex === index;

            return (
              <div
                key={row.id}
                data-active={active ? "true" : "false"}
                data-bloub={showBloubHere ? "true" : "false"}
                className="relative grid min-h-[240px] grid-cols-[28px_1fr] items-start gap-3 md:grid-cols-[1fr_80px_1fr] md:gap-6"
              >
                {/* Point Container: pt-40, 24px dot (or bloub on Arrive) */}
                <div className="relative z-[1] flex justify-center pt-10 md:col-start-2 md:row-start-1">
                  <span
                    ref={(el) => {
                      pointRefs.current[index] = el;
                    }}
                    className="relative flex size-6 items-center justify-center"
                  >
                    {showBloubHere ? (
                      <Bloub
                        phase="arrive"
                        emotionSrc={currentEmotion.assetSrc}
                        emotionLabel={currentEmotion.label}
                        idleAnimation={null}
                        size={44}
                        className={cn(
                          "absolute",
                          !reducedMotion &&
                            "animate-[bloub-arrive_420ms_ease-out]",
                        )}
                      />
                    ) : (
                      <TimelineDot
                        className={cn(
                          "transition-colors duration-300",
                          // Follows the current scroll position (not sticky):
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
                    "py-4 md:row-start-1",
                    row.side === "left" ? "md:col-start-1" : "md:col-start-3",
                  )}
                >
                  <p className="mb-2 text-caption1 text-text-muted md:hidden">
                    {row.side === "left" ? "опыт работы" : "кейсы"}
                  </p>
                  <RoadmapCard
                    data={row.card}
                    active={active}
                    side={row.side}
                    reducedMotion={reducedMotion}
                  />
                </div>

                {index === 0 && !casesLabelInHeader ? (
                  <div className="hidden md:col-start-3 md:row-start-1 md:block">
                    <ColumnLabel label="кейсы" align="right" />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Footer RoadMap: 140px, connector ends in a dot, pb 8 */}
        <footer className="relative h-[140px]">
          <TimelineDot className="absolute bottom-2 left-[14px] -translate-x-1/2 text-surface-points md:left-1/2" />
          <p className="sr-only">Конец roadmap</p>
        </footer>
      </div>
    </section>
  );
}
