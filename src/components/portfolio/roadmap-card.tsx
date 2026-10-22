"use client";

import { TiltedSurface } from "@/components/portfolio/tilted-surface";
import { publicPath, pagePath } from "@/lib/public-path";
import { cn } from "@/lib/utils";
import Image from "next/image";

export type RoadmapCardData =
  | {
      kind: "company";
      id: string;
      name: string;
      role: string;
      dateLabel: string;
      description: string;
      logoSrc: string;
      url?: string | null;
      bloubEmotion: string;
    }
  | {
      kind: "project";
      id: string;
      slug: string;
      title: string;
      dateLabel: string;
      description: string;
      tags: string[];
      logoSrc: string;
      bloubEmotion: string;
    };

type RoadmapCardProps = {
  data: RoadmapCardData;
  active: boolean;
  side: "left" | "right";
  reducedMotion?: boolean;
};

export function RoadmapCard({
  data,
  active,
  side,
  reducedMotion = false,
}: RoadmapCardProps) {
  const tiltEnabled = active && !reducedMotion;

  // Figma `Cards`: 440 wide, radius 32, gap 16, surface/card + border/subtle.
  // Size=XL padding 24. Phone Size=L (189:744) padding 20 — see .roadmap-card.
  const shell = cn(
    "roadmap-card flex w-full max-w-[440px] flex-col gap-4 rounded-[32px] border border-border-subtle bg-surface-card p-6 text-left",
    // Stacked layout: every card shares the left edge. Wide layout: work hugs
    // the center from the left, cases from the right.
    side === "left" ? "min-[1160px]:ml-auto" : "mr-auto",
  );

  // Skeleton plates share the Active card's geometry so Default == Active height.
  // Figma radii, both sizes: date 8, title and role 12, description 16, logo 16.
  const plate = "bg-surface-page ring-1 ring-inset ring-border-subtle";

  if (!active) {
    return (
      <div className={shell} aria-hidden data-state="default">
        <div className="flex w-full items-center gap-3">
          <div className={cn(plate, "size-[52px] shrink-0 rounded-2xl")} />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className={cn(plate, "h-[15px] w-[101px] rounded-[8px]")} />
            <div className={cn(plate, "h-6 w-[215px] max-w-full rounded-[12px]")} />
          </div>
        </div>
        <div className="flex w-full flex-col gap-2">
          <div className={cn(plate, "card-subtitle-plate h-6 w-[101px] rounded-[12px]")} />
          {/* Real description, invisible: plate grows to the exact text height */}
          <div className={cn(plate, "flex w-full flex-col rounded-[16px]")}>
            <p className="card-copy w-full text-subheadline text-text-primary opacity-0">
              {data.description}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const title = data.kind === "company" ? data.name : data.title;

  const inner = (
    <>
      <div className="flex w-full items-center gap-3">
        {data.kind === "company" ? (
          <span className="flex size-[52px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border-subtle bg-surface-page">
            <Image
              src={publicPath(data.logoSrc)}
              alt=""
              width={32}
              height={32}
              className="size-8"
              unoptimized
            />
          </span>
        ) : (
          <Image
            src={publicPath(data.logoSrc)}
            alt=""
            width={52}
            height={52}
            className="size-[52px] shrink-0 rounded-2xl"
            unoptimized
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-caption1 text-text-muted">{data.dateLabel}</span>
          <h3 className="text-title3 text-text-primary">{title}</h3>
        </div>
      </div>
      <div className="flex w-full flex-col gap-2">
        {data.kind === "company" ? (
          <p className="card-role text-body text-text-primary">{data.role}</p>
        ) : (
          <div className="flex flex-wrap gap-2 text-caption1">
            {data.tags.map((tag) => (
              <span
                key={tag}
                className="card-tag flex items-center gap-1 rounded-lg bg-surface-inverse px-2 py-1"
              >
                <span className="text-accent-primary">#</span>
                <span className="text-text-on-inverse">{tag}</span>
              </span>
            ))}
          </div>
        )}
        <p className="card-copy text-subheadline text-text-secondary">{data.description}</p>
      </div>
    </>
  );

  const face = cn(
    "roadmap-card roadmap-card-press flex w-full flex-col gap-4 rounded-[32px] border border-border-subtle bg-surface-card p-6 text-left",
    data.kind === "project" &&
      "cursor-pointer",
  );
  // Bounce scale on the outer box when the pointer arrives.
  // Fill stays `backwards` so the finished transform does not flatten the tilt.
  const reveal = reducedMotion
    ? "opacity-100"
    : "origin-center animate-[card-reveal_640ms_ease_backwards]";
  const align = side === "left" ? "ml-auto" : "mr-auto";

  const card = <div className={face}>{inner}</div>;

  if (tiltEnabled && data.kind === "project") {
    return (
      <a
        href={pagePath(`/projects/${data.slug}`)}
        className={cn("block w-full max-w-[440px]", align, reveal)}
        data-state="active-project"
      >
        <TiltedSurface>{card}</TiltedSurface>
      </a>
    );
  }

  if (tiltEnabled && data.kind === "company" && data.url) {
    return (
      <a
        href={data.url}
        target="_blank"
        rel="noreferrer"
        className={cn("block w-full max-w-[440px]", align, reveal)}
        data-state="active-work"
      >
        <TiltedSurface>{card}</TiltedSurface>
      </a>
    );
  }

  if (tiltEnabled) {
    return (
      <div
        className={cn("w-full max-w-[440px]", align, reveal)}
        data-state="active-work"
      >
        <TiltedSurface>{card}</TiltedSurface>
      </div>
    );
  }

  const className = cn(
    shell,
    "roadmap-card-press",
    reveal,
    data.kind === "project" &&
      "cursor-pointer",
  );

  if (data.kind === "project") {
    return (
      <a
        href={pagePath(`/projects/${data.slug}`)}
        className={className}
        data-state="active-project"
      >
        {inner}
      </a>
    );
  }

  if (data.url) {
    return (
      <a
        href={data.url}
        target="_blank"
        rel="noreferrer"
        className={className}
        data-state="active-work"
      >
        {inner}
      </a>
    );
  }

  return (
    <div className={className} data-state="active-work">
      {inner}
    </div>
  );
}
