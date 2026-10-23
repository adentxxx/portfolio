import { assertAdmin } from "@/lib/admin-auth";
import {
  formatPeriod,
  isSafePublicPath,
  parseEditorBlocks,
  readMonth,
  readYear,
} from "@/lib/content-format";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function present(company: {
  id: string;
  name: string;
  role: string;
  description: string;
  logoSrc: string;
  startMonth: number | null;
  startYear: number | null;
  endMonth: number | null;
  endYear: number | null;
  ongoing: boolean;
  dateLabel: string;
  published: boolean;
  blocks: { id: string; kind: string; text: string }[];
}) {
  return {
    id: company.id,
    name: company.name,
    role: company.role,
    description: company.description,
    logoSrc: company.logoSrc,
    startMonth: company.startMonth,
    startYear: company.startYear,
    endMonth: company.endMonth,
    endYear: company.endYear,
    ongoing: company.ongoing,
    dateLabel: company.dateLabel,
    published: company.published,
    blocks: company.blocks
      .filter(
        (block) =>
          block.kind === "heading" ||
          block.kind === "subheading" ||
          block.kind === "paragraph",
      )
      .map((block) => ({
        id: block.id,
        kind: block.kind,
        text: block.text,
        imageSrc: null,
      })),
  };
}

const include = { blocks: { orderBy: { sortOrder: "asc" as const } } };

async function defaultEmotionId() {
  const calm = await prisma.bloubEmotion.findUnique({ where: { id: "calm" } });
  if (calm) return calm.id;
  const first = await prisma.bloubEmotion.findFirst({ orderBy: { id: "asc" } });
  return first?.id ?? null;
}

export async function POST(request: Request) {
  const denied = assertAdmin(request);
  if (denied) return denied;

  const emotionId = await defaultEmotionId();
  if (!emotionId) return jsonError("В базе нет эмоций bloub", 500);

  const last = await prisma.company.findFirst({ orderBy: { order: "desc" } });
  const created = await prisma.company.create({
    data: {
      name: "Новая компания",
      role: "",
      dateLabel: "",
      description: "",
      logoSrc: "/logos/company-a.svg",
      order: (last?.order ?? 0) + 1,
      bloubEmotion: emotionId,
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
    name?: unknown;
    role?: unknown;
    description?: unknown;
    logoSrc?: unknown;
    startMonth?: unknown;
    startYear?: unknown;
    endMonth?: unknown;
    endYear?: unknown;
    ongoing?: unknown;
    published?: unknown;
    blocks?: unknown;
  } | null;
  if (!body || typeof body.id !== "string") return jsonError("Некорректный запрос", 400);
  if (typeof body.name !== "string" || !body.name.trim() || body.name.length > 200) {
    return jsonError("Нужен заголовок", 400);
  }
  if (typeof body.role !== "string" || body.role.length > 200) {
    return jsonError("Роль слишком длинная", 400);
  }
  if (typeof body.description !== "string" || body.description.length > 4000) {
    return jsonError("Описание карточки слишком длинное", 400);
  }
  if (typeof body.logoSrc !== "string" || !isSafePublicPath(body.logoSrc)) {
    return jsonError("Загрузите логотип", 400);
  }
  if (typeof body.ongoing !== "boolean" || typeof body.published !== "boolean") {
    return jsonError("Некорректный запрос", 400);
  }

  const startMonth = readMonth(body.startMonth);
  const startYear = readYear(body.startYear);
  const endMonth = readMonth(body.endMonth);
  const endYear = readYear(body.endYear);
  if (
    startMonth === "bad" ||
    startYear === "bad" ||
    endMonth === "bad" ||
    endYear === "bad"
  ) {
    return jsonError("Проверьте месяц и год", 400);
  }

  const blocks = parseEditorBlocks(body.blocks, false);
  if (!blocks) return jsonError("Проверьте описание работы", 400);

  const period = {
    startMonth,
    startYear,
    endMonth: body.ongoing ? null : endMonth,
    endYear: body.ongoing ? null : endYear,
    ongoing: body.ongoing,
  };

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.companyBlock.deleteMany({ where: { companyId: body.id as string } });
      if (blocks.length > 0) {
        await tx.companyBlock.createMany({
          data: blocks.map((block, index) => ({
            companyId: body.id as string,
            kind: block.kind,
            text: block.text,
            sortOrder: index,
          })),
        });
      }
      return tx.company.update({
        where: { id: body.id as string },
        data: {
          name: body.name as string,
          role: body.role as string,
          description: body.description as string,
          logoSrc: body.logoSrc as string,
          ...period,
          dateLabel: formatPeriod(period),
          published: body.published as boolean,
        },
        include,
      });
    });
    return NextResponse.json(present(updated));
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return jsonError("Компания не найдена", 404);
    }
    console.error(error);
    return jsonError("Не удалось сохранить компанию", 500);
  }
}

export async function DELETE(request: Request) {
  const denied = assertAdmin(request);
  if (denied) return denied;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return jsonError("Нет id", 400);
  try {
    await prisma.company.delete({ where: { id } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return jsonError("Компания не найдена", 404);
    }
    console.error(error);
    return jsonError("Не удалось удалить компанию", 500);
  }
  return NextResponse.json({ ok: true });
}
