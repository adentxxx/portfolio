"use client";

import { useSound } from "@/hooks/use-sound";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

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
  const { play } = useSound();

  const shell = cn(
    "w-full max-w-[480px] rounded-[28px] border border-border-subtle bg-surface-card",
    side === "left" ? "ml-auto" : "mr-auto",
  );

  if (!active) {
    return (
      <div
        className={cn(shell, "h-[176px]")}
        aria-hidden
        data-state="default"
      >
        <div className="flex h-full flex-col gap-3.5 p-6">
          <div className="flex items-start justify-between">
            <div className="size-11 rounded-2xl bg-surface-control" />
            <div className="h-3 w-16 rounded bg-surface-control" />
          </div>
          <div className="h-4 w-3/5 rounded bg-surface-control" />
          <div className="h-3 w-full rounded bg-surface-control" />
          <div className="h-3 w-4/5 rounded bg-surface-control" />
        </div>
      </div>
    );
  }

  const title = data.kind === "company" ? data.name : data.title;

  const inner = (
    <>
      <div className="mb-3 flex items-start justify-between gap-3">
        <Image
          src={data.logoSrc}
          alt=""
          width={44}
          height={44}
          className="rounded-2xl"
          unoptimized
        />
        <span className="text-caption1 text-text-muted">{data.dateLabel}</span>
      </div>
      <h3 className="text-title3 text-text-primary">{title}</h3>
      {data.kind === "company" ? (
        <p className="mt-1 text-body text-text-secondary">{data.role}</p>
      ) : (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {data.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-surface-inverse px-2.5 py-0.5 text-caption1 text-text-on-inverse"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      <p className="mt-2.5 text-subheadline text-text-secondary">
        {data.description}
      </p>
    </>
  );

  const className = cn(
    shell,
    "block p-6 text-left",
    !reducedMotion &&
      "animate-[card-reveal_480ms_cubic-bezier(0.22,1,0.36,1)_both]",
    reducedMotion && "opacity-100",
    data.kind === "project" &&
      "cursor-pointer transition-colors hover:border-accent-primary focus-visible:border-accent-primary",
  );

  if (data.kind === "project") {
    return (
      <Link
        href={`/projects/${data.slug}`}
        className={className}
        data-state="active-project"
        prefetch
        onClick={() => play("card")}
      >
        {inner}
      </Link>
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
        onClick={() => play("card")}
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
