import { publicPath } from "@/lib/public-path";

/**
 * Figma icons (Hicon / Outline) as exported: natural size and the offset
 * inside the 24px slot. Drawn as a mask so the glyph takes the text color.
 */
const ICONS = {
  globe: { src: "/icons/globe.svg", w: 21.5, h: 21.5, x: 1.25, y: 1.25 },
  moon: { src: "/icons/moon.svg", w: 18.0449, h: 20.8902, x: 3.25, y: 1.25 },
  sun: { src: "/icons/sun.svg", w: 23.5, h: 23.5, x: 0.25, y: 0.25 },
  settings: {
    src: "/icons/settings.svg",
    w: 20.6327,
    h: 22.6885,
    x: 1.68,
    y: 0.655,
  },
  left: { src: "/icons/left.svg", w: 5.5, h: 11.5, x: 9.25, y: 6.25 },
  right: { src: "/icons/right.svg", w: 5.5, h: 11.5, x: 9.25, y: 6.25 },
  home: { src: "/icons/home.svg", w: 22.4795, h: 22.0279, x: 0.76, y: 1.25 },
} as const;

export type GlassIconName = keyof typeof ICONS;

export function GlassIcon({ name }: { name: GlassIconName }) {
  const icon = ICONS[name];
  const image = `url("${publicPath(icon.src)}")`;
  const size = `${icon.w}px ${icon.h}px`;
  const position = `${icon.x}px ${icon.y}px`;
  return (
    <span
      aria-hidden
      className="glass-icon"
      style={{
        maskImage: image,
        WebkitMaskImage: image,
        maskSize: size,
        WebkitMaskSize: size,
        maskPosition: position,
        WebkitMaskPosition: position,
      }}
    />
  );
}
