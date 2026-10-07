import { assertAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  const denied = assertAdmin(request);
  if (denied) return denied;

  const body = await request.json();
  const updated = await prisma.company.update({
    where: { id: body.id },
    data: {
      name: body.name,
      role: body.role,
      dateLabel: body.dateLabel,
      description: body.description,
      logoSrc: body.logoSrc,
      url: body.url,
      order: body.order,
      bloubEmotion: body.bloubEmotion,
      published: body.published,
    },
  });

  return NextResponse.json(updated);
}
