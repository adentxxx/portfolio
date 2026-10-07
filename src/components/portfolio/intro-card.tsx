"use client";

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
  return (
    <section className="mx-auto flex w-full max-w-[600px] flex-col items-center px-4 pt-10 text-center md:pt-16">
      <Image
        src={avatarSrc}
        alt=""
        width={96}
        height={96}
        className="mb-6 rounded-full"
        priority
        unoptimized
      />
      <h1 className="text-title1 text-text-primary md:text-[length:var(--size-title1)]">
        {headline}
      </h1>
      <p className="mt-4 max-w-[520px] text-body text-text-secondary">{bio}</p>
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
