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
    <section className="mx-auto mt-20 w-full max-w-[600px] px-4 pb-28 text-center">
      <div className="rounded-[28px] border border-border-subtle bg-surface-card px-6 py-10">
        <h2 className="text-title2 text-text-primary">{headline}</h2>
        <p className="mt-3 text-body text-text-secondary">{subline}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
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
