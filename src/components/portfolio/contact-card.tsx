"use client";

import { Button } from "@/components/ui/button";
import type { ContactLink } from "@/lib/content";

type ContactCardProps = {
  headline: string;
  subline: string;
  links: ContactLink[];
};

export function ContactCard({ headline, subline, links }: ContactCardProps) {
  return (
    // Figma card/telegram: 680 wide, px 32 / py 40, radius 32, no fill or stroke
    <section className="home-phone-type mx-auto mt-12 w-full max-w-[680px] px-4 text-center md:mt-20 md:px-0">
      <div className="flex flex-col items-center gap-6 rounded-[32px] px-8 py-10">
        <div className="flex w-full flex-col items-center gap-3">
          <h2 className="text-largeTitle text-text-primary">{headline}</h2>
          <p className="text-body text-text-secondary">{subline}</p>
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
