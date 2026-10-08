import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Type-scale utilities from globals.css (`text-title3`, `text-body`, …).
 * Without this, tailwind-merge treats them as text-color classes and drops
 * them whenever a `text-text-*` color class follows in the same `cn()` call.
 */
const typeScaleClasses = [
  "text-largeTitle",
  "text-title1",
  "text-title2",
  "text-title3",
  "text-body",
  "text-subheadline",
  "text-footnote",
  "text-caption1",
  "text-caption2",
];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": typeScaleClasses,
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
