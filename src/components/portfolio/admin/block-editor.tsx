"use client";

import { Button } from "@/components/ui/button";
import { uploadAdminFile } from "@/components/portfolio/admin/api";
import { inputClass } from "@/components/portfolio/admin/fields";
import type { EditorBlock } from "@/lib/content-format";
import Image from "next/image";
import { useState } from "react";

const KIND_LABEL: Record<EditorBlock["kind"], string> = {
  heading: "Заголовок",
  subheading: "Подзаголовок",
  paragraph: "Текст",
  image: "Фотография",
};

function moveBlock(blocks: EditorBlock[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= blocks.length) return blocks;
  const next = blocks.slice();
  const [item] = next.splice(index, 1);
  next.splice(nextIndex, 0, item);
  return next;
}

export function BlockEditor({
  blocks,
  onChange,
  allowImages = false,
  onError,
}: {
  blocks: EditorBlock[];
  onChange: (blocks: EditorBlock[]) => void;
  allowImages?: boolean;
  onError: (error: unknown) => void;
}) {
  const [uploading, setUploading] = useState(false);

  function addText(kind: "heading" | "subheading" | "paragraph") {
    onChange([
      ...blocks,
      { id: crypto.randomUUID(), kind, text: "", imageSrc: null },
    ]);
  }

  async function addImages(files: File[]) {
    setUploading(true);
    try {
      const added: EditorBlock[] = [];
      for (const file of files) {
        const src = await uploadAdminFile(file);
        added.push({
          id: crypto.randomUUID(),
          kind: "image",
          text: "",
          imageSrc: src,
        });
      }
      onChange([...blocks, ...added]);
    } catch (error) {
      onError(error);
    } finally {
      setUploading(false);
    }
  }

  async function replaceImage(id: string, file: File) {
    setUploading(true);
    try {
      const src = await uploadAdminFile(file);
      onChange(
        blocks.map((block) =>
          block.id === id ? { ...block, imageSrc: src } : block,
        ),
      );
    } catch (error) {
      onError(error);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => addText("heading")} disabled={uploading}>
          Заголовок
        </Button>
        <Button
          type="button"
          onClick={() => addText("subheading")}
          disabled={uploading}
        >
          Подзаголовок
        </Button>
        <Button type="button" onClick={() => addText("paragraph")} disabled={uploading}>
          Текст
        </Button>
        {allowImages ? (
          <ImagePick
            label={uploading ? "Загружаю…" : "Фотография"}
            disabled={uploading}
            onFile={(file) => void addImages([file])}
          />
        ) : null}
      </div>

      {blocks.length === 0 ? (
        <p className="text-subheadline text-text-muted">
          {allowImages
            ? "Пока пусто. Добавьте заголовок, подзаголовок, текст или загрузите фотографию."
            : "Пока пусто. Добавьте заголовок, подзаголовок или текст."}
        </p>
      ) : null}

      {blocks.map((block, index) => (
        <div
          key={block.id}
          className="space-y-2 rounded-[16px] border border-border-subtle bg-surface-page p-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-caption1 text-text-muted">
              {KIND_LABEL[block.kind]}
            </span>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={index === 0 || uploading}
                onClick={() => onChange(moveBlock(blocks, index, -1))}
              >
                Выше
              </Button>
              <Button
                type="button"
                disabled={index === blocks.length - 1 || uploading}
                onClick={() => onChange(moveBlock(blocks, index, 1))}
              >
                Ниже
              </Button>
              <Button
                type="button"
                disabled={uploading}
                onClick={() => onChange(blocks.filter((item) => item.id !== block.id))}
              >
                Удалить
              </Button>
            </div>
          </div>
          {block.kind === "image" && block.imageSrc ? (
            <div className="space-y-2">
              <Image
                src={block.imageSrc}
                alt=""
                width={960}
                height={400}
                unoptimized
                className="h-auto max-h-48 w-full rounded-[12px] object-cover"
              />
              <ImagePick
                label="Заменить фото"
                disabled={uploading}
                onFile={(file) => void replaceImage(block.id, file)}
              />
            </div>
          ) : (
            <textarea
              value={block.text}
              rows={block.kind === "paragraph" ? 5 : 2}
              onChange={(event) =>
                onChange(
                  blocks.map((item) =>
                    item.id === block.id
                      ? { ...item, text: event.target.value }
                      : item,
                  ),
                )
              }
              className={inputClass}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function ImagePick({
  label,
  disabled,
  onFile,
}: {
  label: string;
  disabled: boolean;
  onFile: (file: File) => void;
}) {
  return (
    <label className="inline-flex">
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,.png,.jpg,.jpeg,.webp,.gif,.svg"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onFile(file);
        }}
      />
      <span className="inline-flex cursor-pointer items-center justify-center rounded-[20px] bg-surface-control px-5 py-3 text-subheadline text-text-primary">
        {label}
      </span>
    </label>
  );
}
