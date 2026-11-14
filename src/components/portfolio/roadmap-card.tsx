"use client";

import { TiltedSurface } from "@/components/portfolio/tilted-surface";
import { useLocale } from "@/hooks/use-locale";
import { localizePath } from "@/lib/i18n";
import { publicPath, pagePath } from "@/lib/public-path";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";

export type WorkBlock = {
  id: string;
  kind: "heading" | "subheading" | "paragraph";
  text: string;
};

export type CompanyCardData = {
  kind: "company";
  id: string;
  name: string;
  role: string;
  dateLabel: string;
  description: string;
  logoSrc: string;
  url?: string | null;
  bloubEmotion: string;
  bloubShape: string;
  bloubState: string;
  bloubExpression: string | null;
  blocks: WorkBlock[];
  /** Newer cards have a higher rank. Not shown. */
  sortRank: number;
  sortTie: number;
};

export type RoadmapCardData =
  | CompanyCardData
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
      bloubShape: string;
      bloubState: string;
      bloubExpression: string | null;
      /** Newer cards have a higher rank. Not shown. */
      sortRank: number;
      sortTie: number;
    };

/** Geometry and type of the work card at the moment it is pressed. */
export type WorkOrigin = {
  top: number;
  left: number;
  width: number;
  height: number;
  radius: number;
  padding: number;
  gap: number;
  headerGap: number;
  nameGap: number;
  logo: number;
  logoRadius: number;
  icon: number;
  titleSize: number;
  titleLine: number;
  /** Page scroll when the card was pressed, before the modal locks it. */
  scrollY: number;
};

function px(value: string, fallback: number) {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

export function readWorkOrigin(button: HTMLElement): WorkOrigin {
  const face =
    button.querySelector<HTMLElement>("[data-company-face]") ?? button;
  // The button is not transformed. The tilted face's box would be the
  // axis-aligned bounds of the hover, larger than the card in the layout.
  const box = button.getBoundingClientRect();
  const faceStyle = getComputedStyle(face);
  const header = face.firstElementChild;
  const headerStyle = header instanceof HTMLElement ? getComputedStyle(header) : null;
  const name = header instanceof HTMLElement ? header.children[1] : null;
  const nameStyle = name instanceof HTMLElement ? getComputedStyle(name) : null;
  const logo = face.querySelector<HTMLElement>("[data-company-logo]");
  const logoStyle = logo ? getComputedStyle(logo) : null;
  const icon = logo?.querySelector("img");
  const title = face.querySelector("h3");
  const titleStyle = title ? getComputedStyle(title) : null;
  return {
    top: box.top,
    left: box.left,
    width: box.width,
    height: box.height,
    radius: px(faceStyle.borderRadius, 32),
    padding: px(faceStyle.paddingTop, 24),
    gap: px(faceStyle.rowGap || faceStyle.gap, 16),
    headerGap: px(headerStyle?.columnGap || headerStyle?.gap || "", 12),
    nameGap: px(nameStyle?.rowGap || nameStyle?.gap || "", 2),
    logo: logo?.offsetWidth ?? 52,
    logoRadius: px(logoStyle?.borderRadius || "", 16),
    icon: icon?.offsetWidth ?? 32,
    titleSize: px(titleStyle?.fontSize || "", 20),
    titleLine: px(titleStyle?.lineHeight || "", 24),
    scrollY: window.scrollY,
  };
}

type RoadmapCardProps = {
  data: RoadmapCardData;
  /** The card has been reached at least once: its content is in the page. */
  active: boolean;
  /**
   * The timeline is on or past the card right now. Scrolling back turns it
   * off and the card returns to its plates.
   */
  live?: boolean;
  side: "left" | "right";
  reducedMotion?: boolean;
  concealed?: boolean;
  onOpenWork?: (company: CompanyCardData, origin: WorkOrigin) => void;
};

export function RoadmapCard({
  data,
  active,
  live = active,
  side,
  reducedMotion = false,
  concealed = false,
  onOpenWork,
}: RoadmapCardProps) {
  const locale = useLocale();
  const tiltEnabled = active && !reducedMotion;
  // `data-live` goes on one frame after the content mounts, so the first
  // reveal transitions from the hidden state like every later one.
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!active) return;
    const id = requestAnimationFrame(() => setShown(live));
    return () => cancelAnimationFrame(id);
  }, [active, live]);
  // What the root carries in either state. A card that is back on its plates
  // is the Default card again: not focusable, not pressable, hidden from
  // screen readers.
  const liveProps = shown
    ? ({ "data-live": "" } as const)
    : ({ "aria-hidden": true, tabIndex: -1 } as const);
  const idle = !shown && "pointer-events-none";

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

  const plates = (
    <>
      <div className="flex w-full items-center gap-3">
        <div className={cn(plate, "size-[52px] shrink-0 rounded-2xl")} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className={cn(plate, "h-[15px] w-[101px] rounded-[8px]")} />
          <div className={cn(plate, "card-title-plate h-7 w-[215px] max-w-full rounded-[12px]")} />
        </div>
      </div>
      <div className="flex w-full flex-col gap-2">
        <div className={cn(plate, "card-subtitle-plate h-5 w-[101px] rounded-[12px]")} />
        {/* Real description, invisible: plate grows to the exact text height */}
        <div className={cn(plate, "flex w-full flex-col rounded-[16px]")}>
          <p className="card-copy w-full text-subheadline text-text-primary opacity-0">
            {data.description}
          </p>
        </div>
      </div>
    </>
  );

  // Reduced motion has no transitions, so a card that is not live is just
  // the skeleton.
  if (!active || (reducedMotion && !live)) {
    return (
      <div className={shell} aria-hidden data-state="default" data-roll>
        {plates}
      </div>
    );
  }

  const title = data.kind === "company" ? data.name : data.title;

  // Reveal: the box stays put. Each piece of content rises from below and
  // comes into focus (opacity + blur), one after another, while the skeleton
  // plates fade out on top. `step` is the place in that queue. See globals.css.
  const rise = (step: number) =>
    reducedMotion
      ? {}
      : { "data-rise": "", style: { "--rise": step } as CSSProperties };
  const tagStep = 0.6;
  const copyStep =
    data.kind === "company"
      ? 4
      : 3 + Math.min(data.tags.length, 5) * tagStep + 0.4;

  const inner = (
    <>
      <div className="flex w-full items-center gap-3">
        <span
          {...rise(0)}
          data-company-logo={data.kind === "company" ? "" : undefined}
          className="flex size-[52px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border-subtle bg-surface-page"
        >
          <Image
            src={publicPath(data.logoSrc)}
            alt=""
            width={52}
            height={52}
            className="size-full object-cover"
            unoptimized
            loading="eager"
            decoding="sync"
            fetchPriority="high"
          />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span {...rise(1)} className="text-caption1 text-text-muted">
            {data.dateLabel}
          </span>
          <h3 {...rise(2)} className="card-title text-title2 text-text-primary">
            {title}
          </h3>
        </div>
      </div>
      <div className="flex w-full flex-col gap-2">
        {data.kind === "company" ? (
          <p {...rise(3)} className="card-role text-title3 text-text-primary">
            {data.role}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 text-caption1">
            {data.tags.map((tag, index) => (
              <span
                key={tag}
                {...rise(3 + Math.min(index, 5) * tagStep)}
                className="card-tag flex items-center gap-1 rounded-lg bg-surface-inverse px-2 py-1"
              >
                <span className="text-accent-primary">#</span>
                <span className="text-text-on-inverse">{tag}</span>
              </span>
            ))}
          </div>
        )}
        <p {...rise(copyStep)} className="card-copy text-subheadline text-text-secondary">
          {data.description}
        </p>
      </div>
      {/* Last child: the work modal reads the header as the first one. */}
      {reducedMotion ? null : (
        <div aria-hidden className="card-plates">
          {plates}
        </div>
      )}
    </>
  );

  const face = cn(
    "roadmap-card roadmap-card-press relative flex w-full flex-col gap-4 rounded-[32px] border border-border-subtle bg-surface-card p-6 text-left",
    "cursor-pointer",
  );
  const align = side === "left" ? "ml-auto" : "mr-auto";

  const card = <div className={face}>{inner}</div>;

  if (tiltEnabled && data.kind === "project") {
    return (
      <a
        href={pagePath(localizePath(`/projects/${data.slug}`, locale))}
        className={cn("block w-full max-w-[440px]", align, idle)}
        data-state={shown ? "active-project" : "default"}
        data-roll
        {...liveProps}
      >
        <TiltedSurface>{card}</TiltedSurface>
      </a>
    );
  }

  if (data.kind === "company") {
    const visual = (
      <div data-company-face className={face}>
        {inner}
      </div>
    );
    return (
      <button
        type="button"
        data-company-id={data.id}
        data-state={shown ? "active-work" : "default"}
        data-roll
        {...liveProps}
        aria-hidden={concealed || !shown || undefined}
        onClick={(event) => {
          onOpenWork?.(data, readWorkOrigin(event.currentTarget));
        }}
        className={cn(
          "block w-full max-w-[440px] cursor-pointer rounded-[32px] border-0 bg-transparent p-0 text-left",
          align,
          idle,
          concealed && "invisible",
        )}
      >
        {tiltEnabled ? <TiltedSurface>{visual}</TiltedSurface> : visual}
      </button>
    );
  }

  const className = cn(
    shell,
    "roadmap-card-press",
    "cursor-pointer",
    idle,
  );

  if (data.kind === "project") {
    return (
      <a
        href={pagePath(localizePath(`/projects/${data.slug}`, locale))}
        className={className}
        data-state={shown ? "active-project" : "default"}
        data-roll
        {...liveProps}
      >
        {inner}
      </a>
    );
  }
}
