"use client";

import { Bloub } from "@/components/portfolio/bloub";
import {
  RoadmapCard,
  type RoadmapCardData,
} from "@/components/portfolio/roadmap-card";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
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
  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        align === "left" ? "items-start" : "items-end",
      )}
    >
      <span className="text-subheadline text-text-muted">{label}</span>
      <ChevronDown
        className="size-4 text-icon-muted"
        strokeWidth={2}
        aria-hidden
      />
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
  const pointRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const revealedRef = useRef(-1);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [revealedIndex, setRevealedIndex] = useState(-1);
  const [atPointIndex, setAtPointIndex] = useState(-1);
  const [fillPx, setFillPx] = useState(0);
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

      if (window.scrollY > 20) setHasScrolled(true);

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

  const showIdleBloub = !hasScrolled || (revealedIndex < 0 && atPointIndex < 0);
  const currentEmotion =
    atPointIndex >= 0
      ? (rows[atPointIndex]?.emotion ?? fallback)
      : fallback;

  return (
    <section
      className="relative mx-auto mt-14 w-full max-w-[1160px] px-4 md:mt-20"
      aria-label="Roadmap"
    >
      {/* Header: experience label + idle bloub; cases label lives at first project row */}
      <header className="mb-6 grid grid-cols-[1fr_auto_1fr] items-start gap-3 md:mb-8">
        <div className="pt-10 md:pt-14">
          <ColumnLabel label="опыт работы" align="left" />
        </div>

        <div className="flex w-[140px] flex-col items-center md:w-[160px]">
          <div className="relative flex h-[88px] w-[88px] items-center justify-center md:h-[96px] md:w-[96px]">
            {showIdleBloub ? (
              <>
                <span
                  className="pointer-events-none absolute inset-[-12%] rounded-full bg-accent-primary/20 blur-xl"
                  aria-hidden
                />
                <Bloub
                  phase={reducedMotion ? "arrive" : "idle"}
                  emotionSrc={fallback.assetSrc}
                  emotionLabel={fallback.label}
                  idleAnimation={
                    reducedMotion ? null : fallback.idleAnimation
                  }
                  size={80}
                />
              </>
            ) : (
              <span
                className="size-3 rounded-full bg-surface-points"
                aria-hidden
              />
            )}
          </div>

          <div
            className={cn(
              "mt-3 flex flex-col items-center gap-1 transition-opacity duration-500",
              hasScrolled && "opacity-40",
            )}
          >
            <p className="text-center text-caption1 text-accent-primary">
              начинай скроллить
            </p>
            <ChevronDown
              className={cn(
                "size-5 text-accent-primary",
                !hasScrolled && !reducedMotion && "bloub-idle-bob",
              )}
              strokeWidth={2.25}
              aria-hidden
            />
          </div>
        </div>

        <div aria-hidden className="pt-10 md:pt-14" />
      </header>

      <div ref={trackRef} className="relative">
        <div
          className="pointer-events-none absolute left-4 top-0 bottom-10 w-[2px] -translate-x-1/2 rounded-full bg-border-default md:left-1/2"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute left-4 top-0 w-[2px] -translate-x-1/2 origin-top rounded-full bg-accent-primary md:left-1/2"
          style={{
            height: fillPx,
            transition: reducedMotion ? "none" : "height 80ms linear",
          }}
          aria-hidden
        />

        {/*
          Cases label sits at the first content band on the right —
          below experience + scroll hint, not in the header row with «опыт работы».
        */}
        <div className="pointer-events-none absolute right-0 top-2 z-[2] hidden md:block">
          <ColumnLabel label="кейсы" align="right" />
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
                className="relative grid min-h-[220px] grid-cols-[28px_1fr] items-center gap-3 py-3 md:min-h-[240px] md:grid-cols-[1fr_80px_1fr] md:gap-0 md:py-0"
              >
                <div className="relative z-[1] flex h-full items-center justify-center md:col-start-2 md:row-start-1">
                  <span
                    ref={(el) => {
                      pointRefs.current[index] = el;
                    }}
                    className={cn(
                      "relative flex items-center justify-center",
                      showBloubHere ? "size-14" : "size-4",
                    )}
                  >
                    {showBloubHere ? (
                      <Bloub
                        phase="arrive"
                        emotionSrc={currentEmotion.assetSrc}
                        emotionLabel={currentEmotion.label}
                        idleAnimation={null}
                        size={52}
                        className={cn(
                          !reducedMotion &&
                            "animate-[bloub-arrive_420ms_ease-out]",
                        )}
                      />
                    ) : (
                      <span
                        className={cn(
                          "size-3 rounded-full transition-colors duration-300",
                          index <= revealedIndex
                            ? "bg-accent-primary"
                            : "bg-surface-points",
                        )}
                        aria-hidden
                      />
                    )}
                  </span>
                </div>

                <div
                  className={cn(
                    "md:row-start-1",
                    row.side === "left" ? "md:col-start-1" : "md:col-start-3",
                  )}
                >
                  <p className="mb-2 text-caption2 text-text-muted md:hidden">
                    {row.side === "left" ? "опыт работы" : "кейсы"}
                  </p>
                  <RoadmapCard
                    data={row.card}
                    active={active}
                    side={row.side}
                    reducedMotion={reducedMotion}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <footer className="relative flex h-24 items-end justify-center pb-2">
          <span
            className="absolute left-4 size-3 -translate-x-1/2 rounded-full bg-surface-points md:left-1/2"
            aria-hidden
          />
          <p className="sr-only">Конец roadmap</p>
        </footer>
      </div>
    </section>
  );
}
