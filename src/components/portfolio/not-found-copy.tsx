"use client";

import { useLocale, useUi } from "@/hooks/use-locale";
import { localizePath } from "@/lib/i18n";
import { pagePath } from "@/lib/public-path";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/**
 * The 404 page has no route of its own, so the server cannot tell which
 * language was asked for. These pieces read it from the address instead.
 */
export function NotFoundTitle() {
  return <h1 className="sr-only">{useUi().notFoundTitle}</h1>;
}

export function NotFoundBubble() {
  return <>{useUi().notFoundBubble}</>;
}

export function NotFoundHomeLink({
  icon,
  ...rest
}: { icon: ReactNode } & Omit<ComponentProps<typeof Link>, "href">) {
  const ui = useUi();
  const locale = useLocale();
  return (
    // `rest` carries the class and the entrance attributes from <Button asChild>.
    <Link {...rest} href={pagePath(localizePath("/", locale))}>
      {icon}
      {ui.home}
    </Link>
  );
}
