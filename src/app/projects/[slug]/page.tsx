import { FloatingControls } from "@/components/portfolio/floating-controls";
import { Button } from "@/components/ui/button";
import { getHomeContent, getProjectBySlug } from "@/lib/content";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const [project, home] = await Promise.all([
    getProjectBySlug(slug),
    getHomeContent(),
  ]);

  if (!project) notFound();

  return (
    <main className="min-h-screen bg-surface-page pb-28">
      <header className="mx-auto flex w-full max-w-[800px] items-center justify-between px-4 pt-8">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src={home.intro.avatarSrc}
            alt=""
            width={40}
            height={40}
            className="size-10 rounded-xl object-cover object-top"
            unoptimized
          />
          <span className="text-subheadline text-text-secondary">На главную</span>
        </Link>
        <div className="flex flex-wrap gap-2">
          {home.intro.links.slice(0, 2).map((link) => (
            <Button key={link.label} asChild mode="fill" className="h-10">
              <a href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            </Button>
          ))}
        </div>
      </header>

      <article className="mx-auto mt-12 w-full max-w-[800px] px-4">
        <p className="text-caption1 text-text-muted">{project.dateLabel}</p>
        <h1 className="mt-2 text-title1 text-text-primary">{project.title}</h1>
        <p className="mt-4 text-body text-text-secondary">{project.summary}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-surface-inverse px-2.5 py-0.5 text-caption1 text-text-on-inverse"
            >
              {tag}
            </span>
          ))}
        </div>

        <Image
          src={project.heroImage}
          alt=""
          width={800}
          height={420}
          className="mt-10 w-full rounded-[24px] border border-border-subtle"
          unoptimized
        />

        <div className="mt-12 flex flex-col gap-14">
          {project.sections.map((section, index) => (
            <section
              key={section.id}
              className={
                index % 2 === 1
                  ? "flex flex-col gap-6 md:flex-row-reverse md:items-center"
                  : "flex flex-col gap-6 md:flex-row md:items-center"
              }
            >
              {section.imageSrc ? (
                <Image
                  src={section.imageSrc}
                  alt=""
                  width={380}
                  height={260}
                  className="w-full rounded-[20px] border border-border-subtle md:w-1/2"
                  unoptimized
                />
              ) : null}
              <div className="flex-1">
                <h2 className="text-title2 text-text-primary">
                  {section.heading}
                </h2>
                <p className="mt-3 text-body text-text-secondary">
                  {section.body}
                </p>
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 rounded-[28px] border border-border-subtle bg-surface-card px-6 py-8 text-center">
          <h2 className="text-title3 text-text-primary">
            {home.contact.headline}
          </h2>
          <p className="mt-2 text-subheadline text-text-secondary">
            {home.contact.subline}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {home.contact.links.map((link) => (
              <Button key={link.label} asChild mode="fill">
                <a href={link.href} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              </Button>
            ))}
          </div>
        </div>
      </article>

      <FloatingControls />
    </main>
  );
}
