import { assertAdmin } from "@/lib/admin-auth";
import { isSafeHref, isSafePublicPath, parseFaces } from "@/lib/content-format";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

type StoredLink = {
  label: string;
  href: string;
  icon?: string;
  /** English label and address. Left out when empty. */
  labelEn?: string;
  hrefEn?: string;
};

/** Buttons under the intro and in the contact block. Icons belong to the intro. */
function readLinks(raw: unknown, withIcon: boolean): StoredLink[] | null {
  if (!Array.isArray(raw) || raw.length > 12) return null;
  const links: StoredLink[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") return null;
    const record = item as {
      label?: unknown;
      href?: unknown;
      icon?: unknown;
      labelEn?: unknown;
      hrefEn?: unknown;
    };
    if (typeof record.label !== "string" || typeof record.href !== "string") {
      return null;
    }
    const label = record.label.trim();
    const href = record.href.trim();
    if (!label || label.length > 80 || !isSafeHref(href)) return null;
    const link: StoredLink = { label, href };
    if (withIcon && typeof record.icon === "string" && record.icon.length <= 40) {
      link.icon = record.icon;
    }
    if (record.labelEn !== undefined && record.labelEn !== null) {
      if (typeof record.labelEn !== "string") return null;
      const labelEn = record.labelEn.trim();
      if (labelEn.length > 80) return null;
      if (labelEn) link.labelEn = labelEn;
    }
    if (record.hrefEn !== undefined && record.hrefEn !== null) {
      if (typeof record.hrefEn !== "string") return null;
      const hrefEn = record.hrefEn.trim();
      if (hrefEn && !isSafeHref(hrefEn)) return null;
      if (hrefEn) link.hrefEn = hrefEn;
    }
    links.push(link);
  }
  return links;
}

/** English copy: optional, a string within the limit. Missing reads as empty. */
function readEn(value: unknown, max: number): string | null {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string" || value.length > max) return null;
  return value;
}

export async function PUT(request: Request) {
  const denied = assertAdmin(request);
  if (denied) return denied;

  const body = (await request.json().catch(() => null)) as {
    introHeadline?: unknown;
    introBio?: unknown;
    contactHeadline?: unknown;
    contactSubline?: unknown;
    introHeadlineEn?: unknown;
    introBioEn?: unknown;
    contactHeadlineEn?: unknown;
    contactSublineEn?: unknown;
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
  const introHeadlineEn = readEn(body.introHeadlineEn, 2000);
  const introBioEn = readEn(body.introBioEn, 4000);
  const contactHeadlineEn = readEn(body.contactHeadlineEn, 200);
  const contactSublineEn = readEn(body.contactSublineEn, 2000);
  if (
    introHeadlineEn === null ||
    introBioEn === null ||
    contactHeadlineEn === null ||
    contactSublineEn === null
  ) {
    return jsonError("Проверьте английский текст: он слишком длинный", 400);
  }
  const introLinks = readLinks(body.introLinks, true);
  const contactLinks = readLinks(body.contactLinks, false);
  if (!introLinks || !contactLinks) {
    return jsonError(
      "Проверьте кнопки: у каждой нужны подпись и ссылка http, https, mailto или путь на сайте",
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
      introHeadlineEn,
      introBioEn,
      contactHeadlineEn,
      contactSublineEn,
      introLinksJson: JSON.stringify(introLinks),
      contactLinksJson: JSON.stringify(contactLinks),
      avatarFacesJson: JSON.stringify(faces),
      avatarSrc: faces[0],
    },
  });

  return NextResponse.json({
    introHeadline: updated.introHeadline,
    introHeadlineEn: updated.introHeadlineEn,
    introBio: updated.introBio,
    introBioEn: updated.introBioEn,
    contactHeadline: updated.contactHeadline,
    contactHeadlineEn: updated.contactHeadlineEn,
    contactSubline: updated.contactSubline,
    contactSublineEn: updated.contactSublineEn,
    introLinks,
    contactLinks,
    faces: parseFaces(updated.avatarFacesJson),
  });
}
