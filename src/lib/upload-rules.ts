export const IMAGE_MAX_BYTES = 8 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 80 * 1024 * 1024;

export const IMAGE_ACCEPT =
  "image/png,image/jpeg,image/webp,image/gif,image/svg+xml,.png,.jpg,.jpeg,.webp,.gif,.svg";
export const VIDEO_ACCEPT = "video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov";

const IMAGE_TYPES = new Map<string, string>([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["image/svg+xml", "svg"],
]);

const VIDEO_TYPES = new Map<string, string>([
  ["video/mp4", "mp4"],
  ["video/webm", "webm"],
  ["video/quicktime", "mov"],
]);

const IMAGE_EXT: Record<string, string> = {
  png: "png",
  jpg: "jpg",
  jpeg: "jpg",
  webp: "webp",
  gif: "gif",
  svg: "svg",
};

const VIDEO_EXT: Record<string, string> = {
  mp4: "mp4",
  webm: "webm",
  mov: "mov",
};

export type UploadKind = "image" | "video";

export function classifyUpload(file: { type: string; name: string }): {
  kind: UploadKind;
  extension: string;
} | null {
  const imageType = IMAGE_TYPES.get(file.type);
  if (imageType) return { kind: "image", extension: imageType };
  const videoType = VIDEO_TYPES.get(file.type);
  if (videoType) return { kind: "video", extension: videoType };

  const extension = file.name.toLowerCase().split(".").pop() ?? "";
  if (IMAGE_EXT[extension]) return { kind: "image", extension: IMAGE_EXT[extension] };
  if (VIDEO_EXT[extension]) return { kind: "video", extension: VIDEO_EXT[extension] };
  return null;
}
