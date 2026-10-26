const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const trailingSlash = process.env.NEXT_PUBLIC_TRAILING_SLASH === "true";

/** Prefix a public-file path when the site is served from a subpath. */
export function publicPath(src: string) {
  if (!src.startsWith("/") || src.startsWith("//")) return src;
  return `${base}${src}`;
}

/** App route href. A static host needs a trailing slash to find index.html. */
export function pagePath(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const prefixed = `${base}${normalized}`;
  if (!trailingSlash || prefixed.endsWith("/")) return prefixed;
  return `${prefixed}/`;
}
