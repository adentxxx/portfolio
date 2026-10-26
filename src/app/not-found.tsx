import { ButtonHomeIcon } from "@/components/portfolio/decor-icons";
import { Button } from "@/components/ui/button";
import { pagePath, publicPath } from "@/lib/public-path";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404",
};

const POINT_1 = "/tooltip/point-1.svg";
const POINT_2 = "/tooltip/point-2.svg";

function dotMask(src: string, width: number) {
  const url = `url("${publicPath(src)}")`;
  return {
    maskImage: url,
    WebkitMaskImage: url,
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskSize: `${width}px 48px`,
    WebkitMaskSize: `${width}px 48px`,
    maskPosition: "0 0",
    WebkitMaskPosition: "0 0",
  } as const;
}

/**
 * Figma 404 `247:963` and MOB 404 `247:1165`.
 * Digits are Vollkorn 172/164. The face crop and the thought mark sit on the portrait.
 * Phone: digits touch the face, gap to the button is 48. From 768: 8px between
 * digits and the face, 60px down to the button, and the mark shifts right.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-12 bg-surface-page py-12 md:gap-[60px] md:py-0">
      <h1 className="sr-only">404. Куда-то не туда попал</h1>
      <div
        aria-hidden
        className="flex items-end justify-center md:gap-2"
      >
        <Digit />
        <span className="relative size-[140px] shrink-0">
          <span className="absolute inset-0 overflow-hidden">
            <Image
              src={publicPath("/404/face.png")}
              alt=""
              width={960}
              height={1280}
              priority
              unoptimized
              draggable={false}
              className="pointer-events-none absolute top-0 left-[9.82%] h-[107.14%] w-[80.36%] max-w-none select-none"
            />
          </span>
          <span className="pointer-events-none absolute top-[-60px] left-[84px] flex items-start md:left-[120px]">
            <span
              className="block h-12 w-[10px] shrink-0 bg-surface-inverse"
              style={dotMask(POINT_1, 10)}
            />
            <span
              className="block h-12 w-3 shrink-0 bg-surface-inverse"
              style={dotMask(POINT_2, 12)}
            />
            <span
              className="flex items-center justify-center rounded-[24px] bg-surface-inverse px-3 py-1.5 text-center text-caption2 whitespace-nowrap text-text-on-inverse"
              style={{ fontWeight: 500 }}
            >
              куда-то не туда попал...
            </span>
          </span>
        </span>
        <Digit />
      </div>
      <Button asChild mode="accent">
        <Link href={pagePath("/")}>
          <ButtonHomeIcon />
          На главную
        </Link>
      </Button>
    </main>
  );
}

function Digit() {
  return (
    <span className="font-display text-[172px] leading-[164px] font-normal whitespace-nowrap text-text-primary">
      4
    </span>
  );
}
