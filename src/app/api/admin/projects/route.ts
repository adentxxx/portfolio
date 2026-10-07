import { assertAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  const denied = assertAdmin(request);
  if (denied) return denied;

  const body = await request.json();
  const tags = Array.isArray(body.tags)
    ? JSON.stringify(body.tags)
    : body.tags;

  const updated = await prisma.project.update({
    where: { id: body.id },
    data: {
      slug: body.slug,
      title: body.title,
      dateLabel: body.dateLabel,
      description: body.description,
      tags,
      logoSrc: body.logoSrc,
      order: body.order,
      bloubEmotion: body.bloubEmotion,
      summary: body.summary,
      heroImage: body.heroImage,
      published: body.published,
    },
  });

  return NextResponse.json(updated);
}
