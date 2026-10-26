import { assertAdmin } from "@/lib/admin-auth";
import {
  classifyUpload,
  IMAGE_MAX_BYTES,
  VIDEO_MAX_BYTES,
  type UploadKind,
} from "@/lib/upload-rules";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function sizeError(kind: UploadKind) {
  return kind === "video" ? "Видео больше 80 МБ" : "Файл больше 8 МБ";
}

export async function POST(request: Request) {
  const denied = assertAdmin(request);
  if (denied) return denied;

  const requested = new URL(request.url).searchParams.get("kind");
  if (requested !== null && requested !== "image" && requested !== "video") {
    return jsonError("Некорректный запрос", 400);
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return jsonError("Файл не выбран", 400);
  }
  const classified = classifyUpload(file);
  if (!classified) {
    return jsonError(
      "Нужен файл png, jpg, webp, gif, svg, mp4, webm или mov",
      400,
    );
  }
  if (requested && requested !== classified.kind) {
    return jsonError(
      requested === "video"
        ? "Нужен файл mp4, webm или mov"
        : "Нужен файл png, jpg, webp, gif или svg",
      400,
    );
  }
  if (file.size <= 0) return jsonError("Файл пустой", 400);
  const max = classified.kind === "video" ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;
  if (file.size > max) return jsonError(sizeError(classified.kind), 400);

  const root = path.resolve(process.cwd(), "public", "uploads");
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${classified.extension}`;
  const target = path.resolve(root, name);
  if (!target.startsWith(root + path.sep)) {
    return jsonError("Не удалось сохранить файл", 400);
  }

  await mkdir(root, { recursive: true });
  await writeFile(target, Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ src: `/uploads/${name}` });
}
