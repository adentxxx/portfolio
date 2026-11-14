"use client";

import { EmotionFace } from "@/components/portfolio/emotion-face";
import { Typewriter, parsePhrases } from "@/components/portfolio/typewriter";
import { Button } from "@/components/ui/button";
import type { IntroLink } from "@/lib/content";
import { enter } from "@/lib/enter";

type IntroCardProps = {
  headline: string;
  bio: string;
  links: IntroLink[];
  faces: string[];
};

export function IntroCard({ headline, bio, links, faces }: IntroCardProps) {
  // Headline phrases live in SiteSettings.introHeadline — one phrase per line
  // (editable in /admin → Основное).
  const phrases = parsePhrases(headline);

  return (
    <section className="home-phone-type mx-auto flex w-full max-w-[600px] flex-col items-center px-4 pt-12 text-center md:px-0 md:pt-20">
      {/*
        Mobile Intro Block: fixed height so a two-line headline stays inside
        the block and the page below does not jump. Photo 140, title1,
        subheadline, gap 24 / 4. From md: largeTitle, body.
      */}
      <div
        data-roll
        className="flex h-[352px] w-full flex-col items-center gap-6 md:h-auto"
      >
        <div {...enter(0)} className="shrink-0">
          <EmotionFace faces={faces} />
        </div>
        <div className="flex w-full flex-col items-center gap-1 md:gap-2">
          <h1 {...enter(1)} className="min-h-[1lh] text-largeTitle text-text-primary">
            <Typewriter phrases={phrases} periodMs={7000} />
          </h1>
          <p {...enter(2)} className="w-full text-body text-text-secondary">
            {bio}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {links.map((link, index) => (
            <Button
              key={link.label}
              asChild
              mode="fill"
              {...enter(3 + index * 0.5)}
            >
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
