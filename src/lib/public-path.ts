const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefix a public-file path when the site is served from a subpath (GitHub Pages). */
export function publicPath(src: string) {
  if (!src.startsWith("/") || src.startsWith("//")) return src;
  return `${base}${src}`;
}
