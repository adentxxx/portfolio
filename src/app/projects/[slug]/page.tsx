import {
  CaseHomeIcon,
  CaseNextIcon,
  CasePrevIcon,
} from "@/components/portfolio/decor-icons";
import { FloatingControls } from "@/components/portfolio/floating-controls";
import { Button } from "@/components/ui/button";
import { getHomeContent, getProjectBySlug } from "@/lib/content";
import { publicPath, pagePath } from "@/lib/public-path";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

type TextItem = { id: string; heading: string; body: string };

type CaseBlock =
  | { kind: "image"; key: string; src: string }
  | { kind: "text"; key: string; items: TextItem[] };

function caseBlocks(project: {
  heroImage: string;
  sections: {
    id: string;
    heading: string;
    body: string;
    imageSrc: string | null;
  }[];
}): CaseBlock[] {
  const blocks: CaseBlock[] = [];
  if (project.heroImage) {
    blocks.push({ kind: "image", key: "hero", src: project.heroImage });
  }

  let texts: TextItem[] = [];
  const flush = () => {
    if (texts.length === 0) return;
    blocks.push({
      kind: "text",
      key: texts.map((item) => item.id).join("-"),
      items: texts,
    });
    texts = [];
  };

  for (const section of project.sections) {
    texts.push({
      id: section.id,
      heading: section.heading,
      body: section.body,
    });
    if (section.imageSrc) {
      flush();
      blocks.push({
        kind: "image",
        key: `${section.id}-image`,
        src: section.imageSrc,
      });
    }
  }
  flush();
  return blocks;
}

function CaseImage({ src }: { src: string }) {
  return (
    <div className="relative aspect-[116/50] w-full overflow-hidden rounded-[24px] bg-surface-control">
      <Image
        src={publicPath(src)}
        alt=""
        fill
        className="object-cover"
        sizes="(min-width: 1200px) 1160px, 100vw"
        unoptimized
      />
    </div>
  );
}

function CaseNavLink({
  href,
  label,
  className,
  children,
}: {
  href: string | null;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const buttonClass = cn("pointer-events-auto", className);
  if (!href) {
    return (
      <Button mode="icon" disabled aria-label={label} className={buttonClass}>
        {children}
      </Button>
    );
  }
  return (
    <Button asChild mode="icon" className={buttonClass}>
      <Link href={pagePath(href)} aria-label={label}>
        {children}
      </Link>
    </Button>
  );
}

function CaseNav({
  prevHref,
  nextHref,
  stretch,
}: {
  prevHref: string | null;
  nextHref: string | null;
  stretch?: boolean;
}) {
  const sideClass = stretch ? "w-auto min-w-px flex-[1_0_0]" : "w-20";

  return (
    <nav
      aria-label="Другие кейсы"
      className={
        stretch
          ? "pointer-events-auto flex w-full items-center gap-3"
          : "pointer-events-none fixed inset-x-0 bottom-10 z-40 hidden items-center justify-center gap-3 md:flex"
      }
    >
      <CaseNavLink
        href={prevHref}
        label="Предыдущий кейс"
        className={sideClass}
      >
        <CasePrevIcon />
      </CaseNavLink>
      <CaseNavLink href="/" label="На главную">
        <CaseHomeIcon />
      </CaseNavLink>
      <CaseNavLink
        href={nextHref}
        label="Следующий кейс"
        className={sideClass}
      >
        <CaseNextIcon />
      </CaseNavLink>
    </nav>
  );
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const [project, home] = await Promise.all([
    getProjectBySlug(slug),
    getHomeContent(),
  ]);

  if (!project) notFound();

  const index = home.projects.findIndex((item) => item.slug === project.slug);
  const prev = index > 0 ? home.projects[index - 1] : null;
  const next =
    index >= 0 && index < home.projects.length - 1
      ? home.projects[index + 1]
      : null;
  const blocks = caseBlocks(project);

  return (
    <main className="min-h-screen bg-surface-page">
      <div className="mx-auto flex w-full max-w-[1160px] flex-col gap-10 px-4 pt-10 pb-32 min-[1192px]:px-0 md:pb-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <a
            href={pagePath("/")}
            aria-label="На главную"
            className="relative block size-20 shrink-0 overflow-hidden rounded-[32px] bg-surface-control"
          >
            <Image
              src={publicPath(home.intro.avatarSrc)}
              alt=""
              fill
              className="object-cover object-top"
              sizes="80px"
              unoptimized
            />
            <span className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_4px_4px_0_rgba(0,0,0,0.25)]" />
          </a>
          <div className="flex flex-wrap justify-end gap-3">
            {home.intro.links.map((link) => (
              <Button key={link.label} asChild mode="fill">
                <a href={link.href} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              </Button>
            ))}
          </div>
        </header>

        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-largeTitle text-text-primary">{project.title}</h1>
          <p className="max-w-[1160px] text-body text-text-secondary">
            {project.summary}
          </p>
          {project.tags.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-2 text-caption1">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 rounded-lg bg-surface-inverse px-2 py-1"
                >
                  <span className="text-accent-primary">#</span>
                  <span className="text-text-on-inverse">{tag}</span>
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {blocks.map((block) =>
          block.kind === "image" ? (
            <CaseImage key={block.key} src={block.src} />
          ) : (
            <div
              key={block.key}
              className="mx-auto flex w-full max-w-[800px] flex-col gap-6"
            >
              {block.items.map((item) => (
                <section key={item.id} className="flex flex-col gap-3 text-left">
                  <h2 className="text-title3 text-text-primary">{item.heading}</h2>
                  <p className="text-subheadline whitespace-pre-line text-text-secondary">
                    {item.body}
                  </p>
                </section>
              ))}
            </div>
          ),
        )}

      </div>

      {/* Figma Bottom Bar 209:1225: phone stacks Button Bar above a full-width case row. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-end gap-4 px-3 pb-10 md:hidden">
        <FloatingControls embedded className="pointer-events-auto" />
        <CaseNav
          prevHref={prev ? `/projects/${prev.slug}` : null}
          nextHref={next ? `/projects/${next.slug}` : null}
          stretch
        />
      </div>
      <CaseNav
        prevHref={prev ? `/projects/${prev.slug}` : null}
        nextHref={next ? `/projects/${next.slug}` : null}
      />
      <FloatingControls className="max-md:hidden" />
    </main>
  );
}
