"use client";

import { uploadAdminFile } from "@/components/portfolio/admin/api";
import { CheckField, inputClass } from "@/components/portfolio/admin/fields";
import type { EditorBlock } from "@/lib/content-format";
import { classifyUpload, IMAGE_ACCEPT, VIDEO_ACCEPT } from "@/lib/upload-rules";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState } from "react";

const KIND_LABEL: Record<EditorBlock["kind"], string> = {
  heading: "Заголовок",
  subheading: "Подзаголовок",
  paragraph: "Текст",
  image: "Фотография",
  video: "Видео",
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

  async function addMedia(kind: "image" | "video", file: File) {
    const classified = classifyUpload(file);
    if (classified?.kind !== kind) {
      onError(
        new Error(
          kind === "video"
            ? "Нужен файл mp4, webm или mov"
            : "Нужен файл png, jpg, webp, gif или svg",
        ),
      );
      return;
    }
    setUploading(true);
    try {
      const src = await uploadAdminFile(file, kind);
      onChange([
        ...blocks,
        {
          id: crypto.randomUUID(),
          kind,
          text: "",
          imageSrc: src,
          ...(kind === "video"
            ? { autoplay: false, muted: false, loop: false, poster: null, controls: true }
            : {}),
        },
      ]);
    } catch (error) {
      onError(error);
    } finally {
      setUploading(false);
    }
  }

  async function replaceMedia(id: string, kind: "image" | "video", file: File) {
    const classified = classifyUpload(file);
    if (classified?.kind !== kind) {
      onError(
        new Error(
          kind === "video"
            ? "Нужен файл mp4, webm или mov"
            : "Нужен файл png, jpg, webp, gif или svg",
        ),
      );
      return;
    }
    setUploading(true);
    try {
      const src = await uploadAdminFile(file, kind);
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

  function updateVideo(
    id: string,
    patch: { autoplay?: boolean; muted?: boolean; loop?: boolean; controls?: boolean },
  ) {
    onChange(
      blocks.map((block) => {
        if (block.id !== id || block.kind !== "video") return block;
        const next = {
          ...block,
          autoplay: Boolean(block.autoplay),
          muted: Boolean(block.muted),
          loop: Boolean(block.loop),
          controls: block.controls !== false,
          ...patch,
        };
        if (patch.autoplay) next.muted = true;
        if (patch.muted === false) next.autoplay = false;
        return next;
      }),
    );
  }

  async function setPoster(id: string, file: File) {
    if (classifyUpload(file)?.kind !== "image") {
      onError(new Error("Нужен файл png, jpg, webp, gif или svg"));
      return;
    }
    setUploading(true);
    try {
      const src = await uploadAdminFile(file, "image");
      onChange(
        blocks.map((block) => (block.id === id ? { ...block, poster: src } : block)),
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
          <>
            <MediaPick
              label={uploading ? "Загружаю…" : "Фотография"}
              accept={IMAGE_ACCEPT}
              disabled={uploading}
              onFile={(file) => void addMedia("image", file)}
            />
            <MediaPick
              label={uploading ? "Загружаю…" : "Видео"}
              accept={VIDEO_ACCEPT}
              disabled={uploading}
              onFile={(file) => void addMedia("video", file)}
            />
          </>
        ) : null}
      </div>
      {allowImages ? (
        <p className="text-caption2 text-text-muted">
          Фото: png, jpg, webp, gif или svg, до 8 МБ. Видео: mp4, webm или mov, до 80 МБ.
        </p>
      ) : null}

      {blocks.length === 0 ? (
        <p className="text-subheadline text-text-muted">
          {allowImages
            ? "Пока пусто. Добавьте заголовок, подзаголовок, текст, фотографию или видео."
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
          {block.kind === "image" || block.kind === "video" ? (
            <div className="space-y-2">
              {block.kind === "image" && block.imageSrc ? (
                <Image
                  src={block.imageSrc}
                  alt=""
                  width={960}
                  height={400}
                  unoptimized
                  className="h-auto max-h-48 w-full rounded-[12px] object-cover"
                />
              ) : null}
              {block.kind === "video" && block.imageSrc ? (
                <video
                  key={`${block.imageSrc}-${block.poster ?? ""}-${block.autoplay}-${block.muted}-${block.loop}-${block.controls}`}
                  src={block.imageSrc}
                  poster={block.poster || undefined}
                  controls={block.controls !== false}
                  playsInline
                  autoPlay={Boolean(block.autoplay)}
                  muted={Boolean(block.muted || block.autoplay)}
                  loop={Boolean(block.loop)}
                  preload={
                    block.autoplay ? "auto" : block.poster ? "none" : "metadata"
                  }
                  ref={(node) => {
                    if (node) node.muted = Boolean(block.muted || block.autoplay);
                  }}
                  className={
                    block.controls === false
                      ? "video-clean max-h-48 w-full rounded-[12px] bg-surface-control"
                      : "max-h-48 w-full rounded-[12px] bg-surface-control"
                  }
                />
              ) : null}
              {block.kind === "video" ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    <CheckField
                      label="Автовоспроизведение"
                      checked={Boolean(block.autoplay)}
                      onChange={(autoplay) => updateVideo(block.id, { autoplay })}
                    />
                    <CheckField
                      label="Без звука"
                      checked={Boolean(block.muted || block.autoplay)}
                      onChange={(muted) => updateVideo(block.id, { muted })}
                    />
                    <CheckField
                      label="Зациклить"
                      checked={Boolean(block.loop)}
                      onChange={(loop) => updateVideo(block.id, { loop })}
                    />
                    <CheckField
                      label="Скрыть панель управления"
                      checked={block.controls === false}
                      onChange={(hide) => updateVideo(block.id, { controls: !hide })}
                    />
                  </div>
                  <p className="text-caption2 text-text-muted">
                    Автовоспроизведение идёт без звука. Если у посетителя уменьшены анимации, ролик сам не стартует. Без панели запуск и пауза — нажатием на кадр.
                  </p>
                  {block.poster ? (
                    <Image
                      src={block.poster}
                      alt=""
                      width={320}
                      height={180}
                      unoptimized
                      className="h-auto max-h-24 w-40 rounded-[12px] object-cover"
                    />
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <MediaPick
                      label={
                        uploading
                          ? "Загружаю…"
                          : block.poster
                            ? "Заменить обложку"
                            : "Загрузить обложку"
                      }
                      accept={IMAGE_ACCEPT}
                      disabled={uploading}
                      onFile={(file) => void setPoster(block.id, file)}
                    />
                    {block.poster ? (
                      <Button
                        type="button"
                        disabled={uploading}
                        onClick={() =>
                          onChange(
                            blocks.map((item) =>
                              item.id === block.id ? { ...item, poster: null } : item,
                            ),
                          )
                        }
                      >
                        Убрать обложку
                      </Button>
                    ) : null}
                  </div>
                  <p className="text-caption2 text-text-muted">
                    Обложка видна, пока ролик не начал играть, и не даёт показать случайный кадр у тяжёлого файла.
                  </p>
                </div>
              ) : null}
              <MediaPick
                label={block.kind === "video" ? "Заменить видео" : "Заменить фото"}
                accept={block.kind === "video" ? VIDEO_ACCEPT : IMAGE_ACCEPT}
                disabled={uploading}
                onFile={(file) => void replaceMedia(block.id, block.kind as "image" | "video", file)}
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

function MediaPick({
  label,
  accept,
  disabled,
  onFile,
}: {
  label: string;
  accept: string;
  disabled: boolean;
  onFile: (file: File) => void;
}) {
  return (
    <label className="inline-flex">
      <input
        type="file"
        accept={accept}
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
