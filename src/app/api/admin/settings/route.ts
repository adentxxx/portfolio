import { assertAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  const denied = assertAdmin(request);
  if (denied) return denied;

  const body = await request.json();
  const updated = await prisma.siteSettings.update({
    where: { id: "default" },
    data: {
      introHeadline: body.introHeadline,
      introBio: body.introBio,
      contactHeadline: body.contactHeadline,
      contactSubline: body.contactSubline,
    },
  });

  return NextResponse.json(updated);
}
