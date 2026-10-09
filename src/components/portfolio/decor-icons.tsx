import { cn } from "@/lib/utils";

type IconProps = {
  className?: string;
};

/**
 * Figma `icon/container` → `icon/glyph` (Header RoadMap, 40×58 container,
 * glyph bleeds to 46.273×58). Paths copied verbatim; fill via currentColor
 * so Mapped `icon/muted` works in both themes.
 */
export function CurvedArrow({
  className,
  flip = false,
}: IconProps & { flip?: boolean }) {
  return (
    <svg
      width="46.273"
      height="58"
      viewBox="0 0 46.273 58"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("block shrink-0", flip && "-scale-x-100", className)}
    >
      <path
        d="M0.75 7.25C0.335786 7.25 0 7.58579 0 8C0 8.41421 0.335786 8.75 0.75 8.75V8V7.25ZM40.2197 50.5303C40.5126 50.8232 40.9874 50.8232 41.2803 50.5303L46.0533 45.7574C46.3462 45.4645 46.3462 44.9896 46.0533 44.6967C45.7604 44.4038 45.2855 44.4038 44.9926 44.6967L40.75 48.9393L36.5074 44.6967C36.2145 44.4038 35.7396 44.4038 35.4467 44.6967C35.1538 44.9896 35.1538 45.4645 35.4467 45.7574L40.2197 50.5303ZM40.75 48H40V50H40.75H41.5V48H40.75ZM0.75 8V8.75C22.4272 8.75 40 26.3228 40 48H40.75H41.5C41.5 25.4944 23.2556 7.25 0.75 7.25V8Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Figma `arrow down` (138:914) under «начинай скроллить» (11.046×25.5). */
export function ScrollArrow({ className }: IconProps) {
  return (
    <svg
      width="11.0459"
      height="25.5"
      viewBox="0 0 11.0459 25.5"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("block shrink-0", className)}
    >
      <path
        d="M6.27297 0.75C6.27297 0.335786 5.93718 0 5.52297 0C5.10876 0 4.77297 0.335786 4.77297 0.75H5.52297H6.27297ZM4.99264 25.2803C5.28553 25.5732 5.76041 25.5732 6.0533 25.2803L10.8263 20.5074C11.1192 20.2145 11.1192 19.7396 10.8263 19.4467C10.5334 19.1538 10.0585 19.1538 9.76561 19.4467L5.52297 23.6893L1.28033 19.4467C0.987437 19.1538 0.512564 19.1538 0.21967 19.4467C-0.0732231 19.7396 -0.0732231 20.2145 0.21967 20.5074L4.99264 25.2803ZM5.52297 0.75H4.77297V24.75H5.52297H6.27297V0.75H5.52297Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Figma `decor/timeline-dot`: 24×24 container, circle in `surface/points`.
 * Diameter depends on the card type (SDD §5.1): work → 20px, project → 10px.
 */
export function TimelineDot({
  className,
  size = 20,
}: IconProps & { size?: 20 | 10 }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("block shrink-0", className)}
    >
      <circle cx="12" cy="12" r={size / 2} fill="currentColor" />
    </svg>
  );
}
