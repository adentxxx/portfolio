import {
  CaseHomeIcon,
  CaseNextIcon,
  CasePrevIcon,
} from "@/components/portfolio/decor-icons";
import { CaseVideo } from "@/components/portfolio/case-video";
import { FloatingControls } from "@/components/portfolio/floating-controls";
import { ProjectHeader } from "@/components/portfolio/project-header";
import { Button } from "@/components/ui/button";
import { getProjectBySlug, getProjectNav } from "@/lib/content";
import { isSafePublicPath } from "@/lib/content-format";
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

type TextAtom = {
  id: string;
  kind: "heading" | "subheading" | "paragraph";
  text: string;
};

type ImageAtom = { kind: "image"; key: string; src: string };
type VideoAtom = {
  kind: "video";
  key: string;
  src: string;
  autoplay: boolean;
  muted: boolean;
  loop: boolean;
  poster: string | null;
  controls: boolean;
};
type MediaAtom = ImageAtom | VideoAtom;

type CaseBlock = MediaAtom | { kind: "text"; key: string; items: TextAtom[] };

function caseBlocks(project: {
  heroImage: string;
  sections: {
    id: string;
    kind: string;
    heading: string;
    body: string;
    text: string;
    imageSrc: string | null;
    videoAutoplay?: boolean;
    videoMuted?: boolean;
    videoLoop?: boolean;
    videoPoster?: string | null;
    videoControls?: boolean;
  }[];
}): CaseBlock[] {
  const atoms: (MediaAtom | TextAtom)[] = [];
  const heroInSections = project.sections.some(
    (section) => section.imageSrc && section.imageSrc === project.heroImage,
  );
  if (project.heroImage && !heroInSections) {
    atoms.push({ kind: "image", key: "hero", src: project.heroImage });
  }

  for (const section of project.sections) {
    if (section.kind === "image" || section.kind === "video") {
      if (section.imageSrc) {
        atoms.push(
          section.kind === "video"
            ? {
                kind: "video",
                key: section.id,
                src: section.imageSrc,
                autoplay: Boolean(section.videoAutoplay),
                muted: Boolean(section.videoAutoplay || section.videoMuted),
                loop: Boolean(section.videoLoop),
                poster:
                  section.videoPoster && isSafePublicPath(section.videoPoster)
                    ? section.videoPoster
                    : null,
                controls: section.videoControls !== false,
              }
            : { kind: "image", key: section.id, src: section.imageSrc },
        );
      }
      continue;
    }
    if (section.kind === "subheading" || section.kind === "heading") {
      const text = section.text || section.heading;
      if (text) {
        atoms.push({
          id: section.id,
          kind: section.kind,
          text,
        });
      }
      continue;
    }
    if (section.kind === "paragraph") {
      const text = section.text || section.body;
      if (text) atoms.push({ id: section.id, kind: "paragraph", text });
      continue;
    }
    if (section.heading) {
      atoms.push({
        id: `${section.id}-h`,
        kind: "heading",
        text: section.heading,
      });
    }
    if (section.body) {
      atoms.push({
        id: `${section.id}-b`,
        kind: "paragraph",
        text: section.body,
      });
    }
    if (section.imageSrc) {
      atoms.push({
        kind: "image",
        key: `${section.id}-i`,
        src: section.imageSrc,
      });
    }
  }

  const blocks: CaseBlock[] = [];
  let texts: TextAtom[] = [];
  const flush = () => {
    if (texts.length === 0) return;
    blocks.push({
      kind: "text",
      key: texts.map((item) => item.id).join("-"),
      items: texts,
    });
    texts = [];
  };
  for (const atom of atoms) {
    if (atom.kind === "image" || atom.kind === "video") {
      flush();
      blocks.push(atom);
      continue;
    }
    texts.push(atom);
  }
  flush();
  return blocks;
}

function textChunks(items: TextAtom[]) {
  const chunks: { key: string; items: TextAtom[] }[] = [];
  for (const item of items) {
    const last = chunks[chunks.length - 1];
    if (!last || item.kind === "heading") {
      chunks.push({ key: item.id, items: [item] });
      continue;
    }
    last.items.push(item);
    last.key = `${last.key}-${item.id}`;
  }
  return chunks;
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
  const [project, nav] = await Promise.all([
    getProjectBySlug(slug),
    getProjectNav(slug),
  ]);

  if (!project) notFound();

  const prevSlug = nav.prevSlug;
  const nextSlug = nav.nextSlug;
  const blocks = caseBlocks(project);

  return (
    <main className="min-h-screen bg-surface-page">
      <div className="mx-auto flex w-full max-w-[1160px] flex-col gap-10 px-4 pt-10 pb-32 min-[1192px]:px-0 md:pb-10">
        <ProjectHeader links={nav.intro.links} faces={nav.intro.faces} />

        <div className="home-phone-type flex flex-col items-center gap-2 text-center">
          <h1 className="text-largeTitle text-text-primary">{project.title}</h1>
          {project.summary ? (
            <p className="max-w-[1160px] text-body text-text-secondary">
              {project.summary}
            </p>
          ) : null}
          {project.tags.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-2 text-caption1">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="card-tag flex items-center gap-1 rounded-lg bg-surface-inverse px-2 py-1"
                >
                  <span className="text-accent-primary">#</span>
                  <span className="text-text-on-inverse">{tag}</span>
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {blocks.map((block) => {
          if (block.kind === "image") {
            return <CaseImage key={block.key} src={block.src} />;
          }
          if (block.kind === "video") {
            return (
              <CaseVideo
                key={block.key}
                src={block.src}
                autoplay={block.autoplay}
                muted={block.muted}
                loop={block.loop}
                poster={block.poster}
                controls={block.controls}
              />
            );
          }
          return (
            <div
              key={block.key}
              className="mx-auto flex w-full max-w-[800px] flex-col gap-5 text-left md:gap-6"
            >
              {textChunks(block.items).map((chunk) => (
                <section
                  key={chunk.key}
                  className="flex flex-col gap-1 md:gap-3"
                >
                  {chunk.items.map((item) =>
                    item.kind === "heading" ? (
                      <h2 key={item.id} className="text-title3 text-text-primary">
                        {item.text}
                      </h2>
                    ) : item.kind === "subheading" ? (
                      <h3 key={item.id} className="text-body text-text-primary">
                        {item.text}
                      </h3>
                    ) : (
                      <p
                        key={item.id}
                        className="text-subheadline whitespace-pre-line text-text-secondary"
                      >
                        {item.text}
                      </p>
                    ),
                  )}
                </section>
              ))}
            </div>
          );
        })}

      </div>

      {/* Figma Bottom Bar 209:1225: phone stacks Button Bar above a full-width case row. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-end gap-4 px-3 pb-10 md:hidden">
        <FloatingControls embedded className="pointer-events-auto" />
        <CaseNav
          prevHref={prevSlug ? `/projects/${prevSlug}` : null}
          nextHref={nextSlug ? `/projects/${nextSlug}` : null}
          stretch
        />
      </div>
      <CaseNav
        prevHref={prevSlug ? `/projects/${prevSlug}` : null}
        nextHref={nextSlug ? `/projects/${nextSlug}` : null}
      />
      <FloatingControls className="max-md:hidden" />
    </main>
  );
}
