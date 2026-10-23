"use client";

import { EmotionFace } from "@/components/portfolio/emotion-face";
import { Typewriter, parsePhrases } from "@/components/portfolio/typewriter";
import { Button } from "@/components/ui/button";
import type { IntroLink } from "@/lib/content";

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
      <div className="flex h-[352px] w-full flex-col items-center gap-6 md:h-auto">
        <EmotionFace faces={faces} />
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
