"use client";

import { Bloub, type BloubPhase } from "@/components/portfolio/bloub";
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

export function Roadmap({
  companies,
  projects,
  emotions,
  defaultEmotionId = "wave",
}: RoadmapProps) {
  const reducedMotion = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [markerTop, setMarkerTop] = useState(72);

  const emotionMap = useMemo(
    () => new Map(emotions.map((e) => [e.id, e])),
    [emotions],
  );

  const fallback =
    emotionMap.get(defaultEmotionId) ??
    emotions[0] ?? {
      id: "wave",
      label: "Wave",
      assetSrc: "/bloub/wave.svg",
      idleAnimation: "bob",
    };

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
    const onScroll = () => {
      if (window.scrollY > 16) setHasScrolled(true);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const update = () => {
      const section = sectionRef.current;
      if (!section) return;

      const sectionRect = section.getBoundingClientRect();
      const triggerY = window.innerHeight * 0.62;

      let nextActive = -1;
      let nextTop = 72;

      rowRefs.current.forEach((el, index) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const rowMid = rect.top + rect.height * 0.35;
        if (rowMid <= triggerY) {
          nextActive = index;
          nextTop = rect.top + rect.height / 2 - sectionRect.top;
        }
      });

      setActiveIndex(nextActive);
      setMarkerTop(Math.max(56, nextTop));
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const id = window.setInterval(update, 250);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.clearInterval(id);
    };
  }, [rows.length]);

  const phase: BloubPhase = !hasScrolled
    ? "idle"
    : activeIndex >= 0
      ? "arrive"
      : "travel";

  const currentEmotion =
    activeIndex >= 0 ? (rows[activeIndex]?.emotion ?? fallback) : fallback;

  return (
    <section
      ref={sectionRef}
      className="relative mx-auto mt-16 w-full max-w-[1160px] px-4 md:mt-20"
      aria-label="Roadmap"
    >
      <header className="relative mb-6 grid grid-cols-[1fr_auto_1fr] items-end gap-2 md:mb-10">
        <p className="text-left text-subheadline text-text-secondary">
          опыт работы
        </p>
        <div className="flex flex-col items-center gap-2">
          {phase === "idle" && (
            <Bloub
              phase={reducedMotion ? "arrive" : "idle"}
              emotionSrc={fallback.assetSrc}
              emotionLabel={fallback.label}
              idleAnimation={fallback.idleAnimation}
              size={56}
            />
          )}
          <p
            className={cn(
              "text-caption1 text-text-muted transition-opacity duration-300",
              hasScrolled && "opacity-30",
            )}
          >
            начинай скроллить
          </p>
          <ChevronDown
            className={cn(
              "size-4 text-icon-muted transition-opacity",
              hasScrolled && "opacity-20",
              !hasScrolled && !reducedMotion && "bloub-idle-bob",
            )}
            aria-hidden
          />
        </div>
        <p className="text-right text-subheadline text-text-secondary">кейсы</p>
      </header>

      <div className="relative">
        <div
          className="absolute left-4 top-0 bottom-8 w-px bg-border-default md:left-1/2 md:-translate-x-1/2"
          aria-hidden
        />

        <div
          className={cn(
            "pointer-events-none absolute left-4 z-10 flex -translate-x-1/2 items-center justify-center transition-[top] duration-300 ease-out md:left-1/2",
            reducedMotion && "duration-0",
          )}
          style={{ top: markerTop }}
          aria-hidden={phase === "idle"}
        >
          {phase !== "idle" && (
            <Bloub
              phase={phase}
              emotionSrc={currentEmotion.assetSrc}
              emotionLabel={currentEmotion.label}
              idleAnimation={null}
              size={phase === "travel" ? 40 : 48}
            />
          )}
        </div>

        <div className="flex flex-col gap-6 md:gap-8">
          {rows.map((row, index) => {
            const active = index <= activeIndex;
            return (
              <div
                key={row.id}
                ref={(el) => {
                  rowRefs.current[index] = el;
                }}
                data-active={active ? "true" : "false"}
                className="relative grid min-h-[200px] grid-cols-[24px_1fr] items-center gap-3 md:min-h-[240px] md:grid-cols-[1fr_80px_1fr] md:gap-0"
              >
                <div className="relative flex h-full items-center justify-center md:col-start-2 md:row-start-1">
                  <span
                    className={cn(
                      "size-3 rounded-full transition-colors",
                      active ? "bg-accent-primary" : "bg-surface-points",
                    )}
                    aria-hidden
                  />
                </div>

                <div
                  className={cn(
                    "md:row-start-1",
                    row.side === "left" ? "md:col-start-1" : "md:col-start-3",
                  )}
                >
                  <p className="mb-2 text-caption2 text-text-muted md:hidden">
                    {row.side === "left" ? "опыт работы" : "кейс"}
                  </p>
                  <RoadmapCard
                    data={row.card}
                    active={active}
                    side={row.side}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <footer className="relative mt-4 flex h-[100px] items-end justify-center pb-2">
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
