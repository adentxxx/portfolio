"use client";

import { Typewriter, parsePhrases } from "@/components/portfolio/typewriter";
import { Button } from "@/components/ui/button";
import type { IntroLink } from "@/lib/content";
import { publicPath } from "@/lib/public-path";
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
    <section className="home-phone-type mx-auto flex w-full max-w-[600px] flex-col items-center px-4 pt-12 text-center md:px-0 md:pt-20">
      {/*
        Mobile Intro Block (Figma 161:661): fixed 310px so a two-line headline
        stays inside the block and the page below does not jump. Photo 98,
        title1, subheadline, gap 24 / 4. From md: 110 photo, largeTitle, body.
      */}
      <div className="flex h-[310px] w-full flex-col items-center gap-6 md:h-auto">
        <div className="relative size-[98px] shrink-0 overflow-hidden rounded-[32px] bg-surface-control md:size-[110px]">
          <Image
            src={publicPath(avatarSrc)}
            alt=""
            fill
            sizes="(min-width: 768px) 110px, 98px"
            className="object-cover object-top"
            priority
            unoptimized
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_4px_4px_0_rgba(0,0,0,0.25)]"
          />
        </div>
        <div className="flex w-full flex-col items-center gap-1 md:gap-2">
          <h1 className="min-h-[1lh] text-largeTitle text-text-primary">
            <Typewriter phrases={phrases} periodMs={7000} />
          </h1>
          <p className="w-full text-body text-text-secondary">{bio}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {links.map((link) => (
            <Button key={link.label} asChild mode="fill">
              <a href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
