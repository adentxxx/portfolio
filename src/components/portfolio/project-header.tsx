"use client";

import { EmotionFace } from "@/components/portfolio/emotion-face";
import { Button } from "@/components/ui/button";
import type { IntroLink } from "@/lib/content";
import { cn } from "@/lib/utils";
import { useLayoutEffect, useRef, useState } from "react";

type ProjectHeaderProps = {
  links: IntroLink[];
};

/**
 * Project page header. Face and links stay on one row, face left and links
 * right, until the links wrap. Then both rows are centered.
 */
export function ProjectHeader({ links }: ProjectHeaderProps) {
  const headerRef = useRef<HTMLElement>(null);
  const [wrapped, setWrapped] = useState(false);

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const measure = () => {
      const face = header.querySelector("[data-project-face]");
      const actions = header.querySelector("[data-project-actions]");
      if (!(face instanceof HTMLElement) || !(actions instanceof HTMLElement)) {
        return;
      }
      const faceBox = face.getBoundingClientRect();
      const actionsBox = actions.getBoundingClientRect();
      // Same row: shorter links sit lower because the row is centered.
      // Wrapped: the links start at or below the bottom of the face.
      const next = actionsBox.top >= faceBox.bottom - 4;
      setWrapped((current) => (current === next ? current : next));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    return () => observer.disconnect();
  }, [links]);

  return (
    <header
      ref={headerRef}
      className={cn(
        "flex flex-wrap items-center gap-4",
        wrapped ? "justify-center" : "justify-between",
      )}
    >
      <div data-project-face className="shrink-0">
        <EmotionFace size={80} />
      </div>
      <div
        data-project-actions
        className={cn(
          "flex max-w-full flex-wrap gap-3",
          wrapped ? "justify-center" : "justify-end",
        )}
      >
        {links.map((link) => (
          <Button key={link.label} asChild mode="fill">
            <a href={link.href} target="_blank" rel="noreferrer">
              {link.label}
            </a>
          </Button>
        ))}
      </div>
    </header>
  );
}
