import { assertAdmin } from "@/lib/admin-auth";
import {
  formatPoint,
  isSafePublicPath,
  parseEditorBlocks,
  readMonth,
  readYear,
  sectionsToBlocks,
  slugify,
  type StoredBlock,
} from "@/lib/content-format";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function present(project: {
  id: string;
  slug: string;
  title: string;
  description: string;
  summary: string;
  tags: string;
  logoSrc: string;
  createdMonth: number | null;
  createdYear: number | null;
  dateLabel: string;
  bloubEmotion: string;
  heroImage: string;
  published: boolean;
  sections: {
    id: string;
    kind: string;
    heading: string;
    body: string;
    text: string;
    imageSrc: string | null;
  }[];
}) {
  let tags: string[] = [];
  try {
    const parsed = JSON.parse(project.tags) as unknown;
    if (Array.isArray(parsed)) {
      tags = parsed.filter((tag): tag is string => typeof tag === "string");
    }
  } catch {
    tags = [];
  }
  return {
    id: project.id,
    slug: project.slug,
    title: project.title,
    description: project.description,
    summary: project.summary,
    tags,
    logoSrc: project.logoSrc,
    createdMonth: project.createdMonth,
    createdYear: project.createdYear,
    dateLabel: project.dateLabel,
    bloubEmotion: project.bloubEmotion,
    published: project.published,
    blocks: sectionsToBlocks(project.sections, project.heroImage),
  };
}

const include = { sections: { orderBy: { sortOrder: "asc" as const } } };

function sectionRows(projectId: string, blocks: StoredBlock[]) {
  return blocks.map((block, index) => ({
    projectId,
    kind: block.kind,
    text: block.kind === "image" ? "" : block.text,
    heading:
      block.kind === "heading" || block.kind === "subheading" ? block.text : "",
    body: block.kind === "paragraph" ? block.text : "",
    imageSrc: block.kind === "image" ? block.imageSrc : null,
    sortOrder: index,
  }));
}

async function uniqueSlug(base: string, exceptId?: string) {
  const root = base || "proekt";
  let slug = root;
  let suffix = 2;
  while (suffix < 50) {
    const existing = await prisma.project.findFirst({
      where: {
        slug,
        ...(exceptId ? { NOT: { id: exceptId } } : {}),
      },
      select: { id: true },
    });
    if (!existing) return slug;
    slug = `${root}-${suffix}`;
    suffix += 1;
  }
  return `${root}-${Date.now()}`;
}

async function defaultEmotionId() {
  const calm = await prisma.bloubEmotion.findUnique({ where: { id: "calm" } });
  if (calm) return calm.id;
  const first = await prisma.bloubEmotion.findFirst({ orderBy: { id: "asc" } });
  return first?.id ?? null;
}

function readTags(raw: unknown) {
  if (!Array.isArray(raw) || raw.length > 20) return null;
  const tags: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") return null;
    const tag = item.trim();
    if (!tag || tag.length > 40) return null;
    if (!tags.some((current) => current.toLowerCase() === tag.toLowerCase())) {
      tags.push(tag);
    }
  }
  return tags;
}

export async function POST(request: Request) {
  const denied = assertAdmin(request);
  if (denied) return denied;

  const emotionId = await defaultEmotionId();
  if (!emotionId) return jsonError("В базе нет эмоций bloub", 500);
  const last = await prisma.project.findFirst({ orderBy: { order: "desc" } });
  const slug = await uniqueSlug(slugify("Новый проект"));
  const created = await prisma.project.create({
    data: {
      slug,
      title: "Новый проект",
      dateLabel: "",
      description: "",
      tags: "[]",
      logoSrc: "/logos/project-a.svg",
      order: (last?.order ?? 0) + 1,
      bloubEmotion: emotionId,
      summary: "",
      heroImage: "",
      published: false,
    },
    include,
  });
  return NextResponse.json(present(created));
}

export async function PUT(request: Request) {
  const denied = assertAdmin(request);
  if (denied) return denied;

  const body = (await request.json().catch(() => null)) as {
    id?: unknown;
    slug?: unknown;
    title?: unknown;
    description?: unknown;
    summary?: unknown;
    tags?: unknown;
    logoSrc?: unknown;
    createdMonth?: unknown;
    createdYear?: unknown;
    bloubEmotion?: unknown;
    published?: unknown;
    blocks?: unknown;
  } | null;
  if (!body || typeof body.id !== "string") return jsonError("Некорректный запрос", 400);
  if (typeof body.title !== "string" || !body.title.trim() || body.title.length > 200) {
    return jsonError("Нужен заголовок", 400);
  }
  if (typeof body.description !== "string" || body.description.length > 4000) {
    return jsonError("Описание карточки слишком длинное", 400);
  }
  if (typeof body.summary !== "string" || body.summary.length > 4000) {
    return jsonError("Вступление слишком длинное", 400);
  }
  if (typeof body.logoSrc !== "string" || !isSafePublicPath(body.logoSrc)) {
    return jsonError("Загрузите логотип", 400);
  }
  if (typeof body.bloubEmotion !== "string" || typeof body.published !== "boolean") {
    return jsonError("Некорректный запрос", 400);
  }
  if (typeof body.slug !== "string" || body.slug.length > 120) {
    return jsonError("Проверьте адрес страницы", 400);
  }

  const createdMonth = readMonth(body.createdMonth);
  const createdYear = readYear(body.createdYear);
  if (createdMonth === "bad" || createdYear === "bad") {
    return jsonError("Проверьте дату", 400);
  }
  const tags = readTags(body.tags);
  if (!tags) return jsonError("Проверьте теги", 400);
  const blocks = parseEditorBlocks(body.blocks, true);
  if (!blocks) return jsonError("Проверьте описание проекта", 400);

  const emotion = await prisma.bloubEmotion.findUnique({
    where: { id: body.bloubEmotion },
    select: { id: true },
  });
  if (!emotion) return jsonError("Такой эмоции bloub нет", 400);

  const slug = await uniqueSlug(
    slugify(body.slug) || slugify(body.title) || "proekt",
    body.id,
  );
  const heroImage = blocks.find((block) => block.kind === "image")?.imageSrc ?? "";

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.projectSection.deleteMany({ where: { projectId: body.id as string } });
      if (blocks.length > 0) {
        await tx.projectSection.createMany({
          data: sectionRows(body.id as string, blocks),
        });
      }
      return tx.project.update({
        where: { id: body.id as string },
        data: {
          slug,
          title: body.title as string,
          description: body.description as string,
          summary: body.summary as string,
          tags: JSON.stringify(tags),
          logoSrc: body.logoSrc as string,
          createdMonth,
          createdYear,
          dateLabel: formatPoint(createdMonth, createdYear),
          bloubEmotion: body.bloubEmotion as string,
          heroImage,
          published: body.published as boolean,
        },
        include,
      });
    });
    return NextResponse.json(present(updated));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") return jsonError("Проект не найден", 404);
      if (error.code === "P2002") return jsonError("Такой адрес страницы уже есть", 400);
    }
    console.error(error);
    return jsonError("Не удалось сохранить проект", 500);
  }
}

export async function DELETE(request: Request) {
  const denied = assertAdmin(request);
  if (denied) return denied;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return jsonError("Нет id", 400);
  try {
    await prisma.project.delete({ where: { id } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return jsonError("Проект не найден", 404);
    }
    console.error(error);
    return jsonError("Не удалось удалить проект", 500);
  }
  return NextResponse.json({ ok: true });
}
