"use client";

import { Typewriter, parsePhrases } from "@/components/portfolio/typewriter";
import { Button } from "@/components/ui/button";
import type { IntroLink } from "@/lib/content";
import Image from "next/image";

type IntroCardProps = {
  headline: string;
  bio: string;
  avatarSrc: string;
  links: IntroLink[];
};

export function IntroCard({ headline, bio, avatarSrc, links }: IntroCardProps) {
  // Headline phrases live in SiteSettings.introHeadline — one phrase per line
  // (editable in /admin → Site settings → Intro headline, or prisma/seed.ts).
  const phrases = parsePhrases(headline);

  return (
    <section className="mx-auto flex w-full max-w-[600px] flex-col items-center px-4 pt-12 text-center md:px-0 md:pt-20">
      {/* Figma img/content: 110×110, radius 32, inner shadow */}
      <div className="relative size-[110px] shrink-0 overflow-hidden rounded-[32px] bg-surface-control">
        <Image
          src={avatarSrc}
          alt=""
          fill
          sizes="110px"
          className="object-cover object-top"
          priority
          unoptimized
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_4px_4px_0_rgba(0,0,0,0.25)]"
        />
      </div>
      <h1 className="mt-6 min-h-[1lh] text-largeTitle text-text-primary">
        <Typewriter phrases={phrases} periodMs={7000} />
      </h1>
      <p className="mt-2 w-full text-body text-text-secondary">{bio}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {links.map((link) => (
          <Button key={link.label} asChild mode="fill">
            <a href={link.href} target="_blank" rel="noreferrer">
              {link.label}
            </a>
          </Button>
        ))}
      </div>
    </section>
  );
}
