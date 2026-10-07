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
};

export function RoadmapCard({ data, active, side }: RoadmapCardProps) {
  const { play } = useSound();

  if (!active) {
    return (
      <div
        className={cn(
          "h-[168px] w-full max-w-[420px] rounded-[24px] border border-border-subtle bg-surface-card",
          side === "left" ? "ml-auto" : "mr-auto",
        )}
        aria-hidden
      >
        <div className="flex h-full flex-col gap-3 p-5">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-surface-control" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-surface-control" />
          <div className="h-3 w-full animate-pulse rounded bg-surface-control" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-surface-control" />
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
          width={40}
          height={40}
          className="rounded-xl"
          unoptimized
        />
        <span className="text-caption1 text-text-muted">{data.dateLabel}</span>
      </div>
      <h3 className="text-title3 text-text-primary">{title}</h3>
      {data.kind === "company" ? (
        <p className="mt-1 text-body text-text-secondary">{data.role}</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-1.5">
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
      <p className="mt-2 text-subheadline text-text-secondary">
        {data.description}
      </p>
    </>
  );

  const className = cn(
    "block w-full max-w-[420px] rounded-[24px] border border-border-subtle bg-surface-card p-5 text-left transition-all duration-500",
    "opacity-100 translate-y-0",
    side === "left" ? "ml-auto" : "mr-auto",
    data.kind === "project" &&
      "cursor-pointer hover:border-accent-primary focus-visible:border-accent-primary",
  );

  if (data.kind === "project") {
    return (
      <Link
        href={`/projects/${data.slug}`}
        className={className}
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
        onClick={() => play("card")}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => play("card")}
    >
      {inner}
    </button>
  );
}
