import { assertAdmin } from "@/lib/admin-auth";
import { isSafeHref, isSafePublicPath, parseFaces } from "@/lib/content-format";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

type IntroLink = { label: string; href: string; icon?: string };
type ContactLink = { label: string; href: string };

function readIntroLinks(raw: unknown): IntroLink[] | null {
  if (!Array.isArray(raw) || raw.length > 12) return null;
  const links: IntroLink[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") return null;
    const label = (item as { label?: unknown }).label;
    const href = (item as { href?: unknown }).href;
    const icon = (item as { icon?: unknown }).icon;
    if (typeof label !== "string" || typeof href !== "string") return null;
    const trimmedLabel = label.trim();
    const trimmedHref = href.trim();
    if (!trimmedLabel || trimmedLabel.length > 80 || !isSafeHref(trimmedHref)) {
      return null;
    }
    const link: IntroLink = { label: trimmedLabel, href: trimmedHref };
    if (typeof icon === "string" && icon.length <= 40) link.icon = icon;
    links.push(link);
  }
  return links;
}

function readContactLinks(raw: unknown): ContactLink[] | null {
  if (!Array.isArray(raw) || raw.length > 12) return null;
  const links: ContactLink[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") return null;
    const label = (item as { label?: unknown }).label;
    const href = (item as { href?: unknown }).href;
    if (typeof label !== "string" || typeof href !== "string") return null;
    const trimmedLabel = label.trim();
    const trimmedHref = href.trim();
    if (!trimmedLabel || trimmedLabel.length > 80 || !isSafeHref(trimmedHref)) {
      return null;
    }
    links.push({ label: trimmedLabel, href: trimmedHref });
  }
  return links;
}

export async function PUT(request: Request) {
  const denied = assertAdmin(request);
  if (denied) return denied;

  const body = (await request.json().catch(() => null)) as {
    introHeadline?: unknown;
    introBio?: unknown;
    contactHeadline?: unknown;
    contactSubline?: unknown;
    introLinks?: unknown;
    contactLinks?: unknown;
    faces?: unknown;
  } | null;
  if (!body) return jsonError("Некорректный запрос", 400);
  if (typeof body.introHeadline !== "string" || body.introHeadline.length > 2000) {
    return jsonError("Проверьте заголовок", 400);
  }
  if (!body.introHeadline.split(/\r?\n/).some((line) => line.trim())) {
    return jsonError("Нужна хотя бы одна фраза заголовка", 400);
  }
  if (typeof body.introBio !== "string" || body.introBio.length > 4000) {
    return jsonError("Проверьте описание", 400);
  }
  if (
    typeof body.contactHeadline !== "string" ||
    body.contactHeadline.length > 200
  ) {
    return jsonError("Проверьте заголовок обратной связи", 400);
  }
  if (
    typeof body.contactSubline !== "string" ||
    body.contactSubline.length > 2000
  ) {
    return jsonError("Проверьте текст обратной связи", 400);
  }
  const introLinks = readIntroLinks(body.introLinks);
  const contactLinks = readContactLinks(body.contactLinks);
  if (!introLinks || !contactLinks) {
    return jsonError(
      "Проверьте кнопки: у каждой нужны подпись и ссылка http, https, mailto или путь на сайте",
      400,
    );
  }
  if (!Array.isArray(body.faces) || body.faces.length < 1 || body.faces.length > 12) {
    return jsonError("Нужна хотя бы одна фотография", 400);
  }
  const faces = body.faces.filter(
    (face): face is string => typeof face === "string" && isSafePublicPath(face),
  );
  if (faces.length !== body.faces.length) {
    return jsonError("Фотография указана неверно", 400);
  }

  const updated = await prisma.siteSettings.update({
    where: { id: "default" },
    data: {
      introHeadline: body.introHeadline,
      introBio: body.introBio,
      contactHeadline: body.contactHeadline,
      contactSubline: body.contactSubline,
      introLinksJson: JSON.stringify(introLinks),
      contactLinksJson: JSON.stringify(contactLinks),
      avatarFacesJson: JSON.stringify(faces),
      avatarSrc: faces[0],
    },
  });

  return NextResponse.json({
    introHeadline: updated.introHeadline,
    introBio: updated.introBio,
    contactHeadline: updated.contactHeadline,
    contactSubline: updated.contactSubline,
    introLinks,
    contactLinks,
    faces: parseFaces(updated.avatarFacesJson),
  });
}
