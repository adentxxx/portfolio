import { assertAdmin } from "@/lib/admin-auth";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const EXTENSIONS = new Map<string, string>([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["image/svg+xml", "svg"],
]);

const MAX_BYTES = 8 * 1024 * 1024;

function extensionFor(file: File) {
  const fromType = EXTENSIONS.get(file.type);
  if (fromType) return fromType;
  const name = file.name.toLowerCase();
  if (name.endsWith(".png")) return "png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "jpg";
  if (name.endsWith(".webp")) return "webp";
  if (name.endsWith(".gif")) return "gif";
  if (name.endsWith(".svg")) return "svg";
  return null;
}

export async function POST(request: Request) {
  const denied = assertAdmin(request);
  if (denied) return denied;

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не выбран" }, { status: 400 });
  }
  const extension = extensionFor(file);
  if (!extension) {
    return NextResponse.json(
      { error: "Нужен файл png, jpg, webp, gif или svg" },
      { status: 400 },
    );
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Файл больше 8 МБ" }, { status: 400 });
  }

  const root = path.resolve(process.cwd(), "public", "uploads");
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const target = path.resolve(root, name);
  if (!target.startsWith(root + path.sep)) {
    return NextResponse.json({ error: "Не удалось сохранить файл" }, { status: 400 });
  }

  await mkdir(root, { recursive: true });
  await writeFile(target, Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ src: `/uploads/${name}` });
}
