"use client";

import { CloseIcon } from "@/components/portfolio/decor-icons";
import type { CompanyCardData, WorkOrigin } from "@/components/portfolio/roadmap-card";
import { Button } from "@/components/ui/button";
import { publicPath } from "@/lib/public-path";
import { motion } from "motion/react";
import Image from "next/image";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type TextItem = {
  id: string;
  kind: "heading" | "subheading" | "paragraph";
  text: string;
};

type Morph = WorkOrigin;

const EASE = [0.22, 1, 0.36, 1] as const;
const DURATION = 0.6;

function textChunks(items: TextItem[]) {
  const chunks: { key: string; items: TextItem[] }[] = [];
  for (const item of items) {
    const last = chunks[chunks.length - 1];
    if (!last || item.kind === "heading") {
      chunks.push({ key: item.id, items: [item] });
      continue;
    }
    last.items.push(item);
    last.key = `${last.key}-${item.id}`;
  }
  return chunks;
}

function workItems(company: CompanyCardData) {
  const items: TextItem[] = [];
  if (company.role.trim()) {
    items.push({ id: "role", kind: "heading", text: company.role });
  }
  if (company.description.trim()) {
    items.push({
      id: "description",
      kind: "paragraph",
      text: company.description,
    });
  }
  for (const block of company.blocks) {
    if (!block.text.trim()) continue;
    items.push(block);
  }
  return textChunks(items);
}

function TextBlocks({ chunks }: { chunks: ReturnType<typeof textChunks> }) {
  return (
    <>
      {chunks.map((chunk) => (
        <section key={chunk.key} className="flex flex-col gap-3">
          {chunk.items.map((item) =>
            item.kind === "heading" ? (
              <h3 key={item.id} className="text-title3 text-text-primary">
                {item.text}
              </h3>
            ) : item.kind === "subheading" ? (
              <p
                key={item.id}
                className="text-body whitespace-pre-line text-text-primary"
              >
                {item.text}
              </p>
            ) : (
              <p
                key={item.id}
                className="text-subheadline whitespace-pre-line text-text-secondary"
              >
                {item.text}
              </p>
            ),
          )}
        </section>
      ))}
    </>
  );
}

function px(value: string, fallback: number) {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

export function WorkModal({
  company,
  origin,
  onClose,
}: {
  company: CompanyCardData;
  origin: WorkOrigin;
  onClose: () => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const phaseRef = useRef<"open" | "closing">("open");
  const closedRef = useRef(false);
  const [phase, setPhase] = useState<"open" | "closing">("open");
  const [target, setTarget] = useState<Morph>(origin);
  const targetRef = useRef(target);
  targetRef.current = target;
  const [scrollable, setScrollable] = useState(false);
  const [settled, setSettled] = useState(false);
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const duration = reduced ? 0 : DURATION;
  const chunks = workItems(company);

  useLayoutEffect(() => {
    const main = document.querySelector("main");
    const root = document.documentElement;
    // Captured at the click. Reading window.scrollY here is already 0 once
    // the body is pinned, and a late read loses the place on the roadmap.
    const scrollY = Number.isFinite(origin.scrollY) ? origin.scrollY : window.scrollY;
    // innerWidth includes a classic scrollbar. On a phone, a too-wide element
    // inflates innerWidth the same way, and padding the body by that amount
    // shifts the whole page when the dialog opens and closes.
    const gap = window.innerWidth - root.clientWidth;
    const scrollbar = gap > 0 && gap <= 24 ? gap : 0;
    const prev = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      paddingRight: document.body.style.paddingRight,
    };
    // Pin the page. Right padding stands in for the scrollbar so the card
    // stays put while the panel grows out of it. The flag tells the roadmap
    // to ignore the scroll event this pin emits.
    root.dataset.scrollLock = "1";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    main?.setAttribute("inert", "");

    const measure = measureRef.current;
    let dest = origin;
    if (measure) {
      const style = getComputedStyle(measure);
      const header = measure.querySelector<HTMLElement>("[data-measure-header]");
      const name = measure.querySelector<HTMLElement>("[data-measure-name]");
      const logo = measure.querySelector<HTMLElement>("[data-measure-logo]");
      const icon = logo?.querySelector("img");
      const title = measure.querySelector<HTMLElement>("[data-measure-title]");
      const titleStyle = title ? getComputedStyle(title) : null;
      const headerStyle = header ? getComputedStyle(header) : null;
      const nameStyle = name ? getComputedStyle(name) : null;
      const logoStyle = logo ? getComputedStyle(logo) : null;
      const natural = measure.offsetHeight;
      const width = measure.offsetWidth;
      const maxHeight = window.innerHeight - 104;
      const height = Math.min(natural, maxHeight);
      const top = Math.max(80, (window.innerHeight - height) / 2);
      dest = {
        top,
        left: (window.innerWidth - width) / 2,
        width,
        height,
        radius: px(style.borderRadius, 48),
        padding: px(style.paddingTop, 40),
        gap: px(style.rowGap || style.gap, 24),
        headerGap: px(headerStyle?.columnGap || headerStyle?.gap || "", 20),
        nameGap: px(nameStyle?.rowGap || nameStyle?.gap || "", 4),
        logo: logo?.offsetWidth ?? 72,
        logoRadius: px(logoStyle?.borderRadius || "", 22),
        icon: icon?.offsetWidth ?? 44,
        titleSize: px(titleStyle?.fontSize || "", 28),
        titleLine: px(titleStyle?.lineHeight || "", 32),
        scrollY: origin.scrollY,
      };
      setScrollable(natural > height + 1);
    }
    setTarget(dest);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setSettled(true);
    }

    return () => {
      main?.removeAttribute("inert");
      delete root.dataset.scrollLock;
      document.body.style.position = prev.position;
      document.body.style.top = prev.top;
      document.body.style.left = prev.left;
      document.body.style.right = prev.right;
      document.body.style.width = prev.width;
      document.body.style.paddingRight = prev.paddingRight;
      const restoreScroll = () => {
        const behavior = root.style.scrollBehavior;
        root.style.scrollBehavior = "auto";
        window.scrollTo(0, scrollY);
        root.style.scrollBehavior = behavior;
      };
      // html has scroll-behavior: smooth, which would glide back from the top.
      restoreScroll();
      const id = company.id;
      requestAnimationFrame(() => {
        restoreScroll();
        document
          .querySelector<HTMLElement>(`[data-company-id="${CSS.escape(id)}"]`)
          ?.focus({ preventScroll: true, focusVisible: false } as FocusOptions);
      });
    };
  }, [company.id, origin]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
        return;
      }
      if (event.key !== "Tab") return;
      const root = dialogRef.current;
      if (!root) return;
      const focusable = [
        ...root.querySelectorAll<HTMLElement>("button, [href], [tabindex]"),
      ].filter((el) => !el.hasAttribute("disabled"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [company.id]);

  function requestClose() {
    if (phaseRef.current === "closing") return;
    phaseRef.current = "closing";
    const card = document.querySelector<HTMLElement>(
      `[data-company-id="${CSS.escape(company.id)}"]`,
    );
    if (card) {
      card.dataset.focusReturn = "";
      card.addEventListener(
        "blur",
        () => {
          delete card.dataset.focusReturn;
        },
        { once: true },
      );
    }
    if (reduced) {
      onCloseRef.current();
      return;
    }
    setPhase("closing");
    setSettled(false);
    const button = document.querySelector<HTMLElement>(
      `[data-company-id="${CSS.escape(company.id)}"]`,
    );
    const box = button?.getBoundingClientRect();
    setTarget({
      ...origin,
      top: box?.top ?? origin.top,
      left: box?.left ?? origin.left,
      width: box?.width ?? origin.width,
      height: box?.height ?? origin.height,
    });
  }

  const moving = {
    duration,
    ease: EASE,
  };

  return createPortal(
    <>
      <div
        ref={measureRef}
        aria-hidden
        className="work-modal pointer-events-none invisible fixed top-0 left-0 -z-10 flex w-[min(880px,calc(100vw-40px))] flex-col gap-6 rounded-[48px] border border-border-subtle"
      >
        <div data-measure-header className="flex items-center gap-3 md:gap-5">
          <span
            data-measure-logo
            className="flex size-[52px] shrink-0 items-center justify-center rounded-2xl border border-border-subtle md:size-[72px] md:rounded-[22px]"
          >
            {company.logoSrc ? (
              <Image
                src={publicPath(company.logoSrc)}
                alt=""
                width={44}
                height={44}
                className="size-8 md:size-11"
                unoptimized
              />
            ) : null}
          </span>
          <div data-measure-name className="flex min-w-0 flex-1 flex-col gap-0.5 md:gap-1">
            <span className="work-modal-date text-caption1">{company.dateLabel}</span>
            <span data-measure-title className="work-modal-title text-title1">
              {company.name}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <TextBlocks chunks={chunks} />
        </div>
      </div>

      <motion.div
        className="fixed inset-0 z-[60] bg-surface-overlay-dark backdrop-blur-[20px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === "closing" ? 0 : 1 }}
        transition={moving}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          requestClose();
        }}
      />

      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-work-dialog
        data-work-panel
        className="fixed z-[61]"
        initial={false}
        animate={{
          top: target.top,
          left: target.left,
          width: target.width,
          height: target.height,
        }}
        transition={moving}
        onAnimationComplete={() => {
          const panel = dialogRef.current;
          const goal = targetRef.current;
          if (!panel) return;
          const box = panel.getBoundingClientRect();
          // An interrupted flight can report completion before the panel
          // has reached the rect this phase is aiming at.
          const arrived =
            Math.abs(box.top - goal.top) < 3 &&
            Math.abs(box.left - goal.left) < 3 &&
            Math.abs(box.width - goal.width) < 3 &&
            Math.abs(box.height - goal.height) < 3;
          if (!arrived) return;
          if (phaseRef.current === "closing") {
            if (closedRef.current) return;
            closedRef.current = true;
            onCloseRef.current();
          } else setSettled(true);
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === "closing" ? 0 : 1 }}
          transition={{
            duration: reduced ? 0 : phase === "closing" ? 0.16 : 0.28,
            delay: reduced || phase === "closing" ? 0 : 0.32,
            ease: EASE,
          }}
          className="absolute right-0 bottom-[calc(100%+24px)]"
          style={{ pointerEvents: settled && phase === "open" ? "auto" : "none" }}
        >
          <Button ref={closeRef} type="button" onClick={requestClose}>
            <CloseIcon />
            закрыть
          </Button>
        </motion.div>

        <motion.div
          className="absolute inset-0 flex flex-col overflow-hidden border border-border-subtle bg-surface-card"
          initial={false}
          animate={{
            borderRadius: target.radius,
            padding: target.padding,
          }}
          transition={moving}
          style={{ overflow: settled && scrollable ? "auto" : "hidden" }}
        >
          <div className="flex items-center">
            <motion.span
              className="flex shrink-0 items-center justify-center overflow-hidden border border-border-subtle bg-surface-page"
              initial={false}
              animate={{
                width: target.logo,
                height: target.logo,
                borderRadius: target.logoRadius,
              }}
              transition={moving}
            >
              {company.logoSrc ? (
                <motion.span
                  className="relative block"
                  initial={false}
                  animate={{ width: target.icon, height: target.icon }}
                  transition={moving}
                >
                  <Image
                    src={publicPath(company.logoSrc)}
                    alt=""
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </motion.span>
              ) : null}
            </motion.span>
            <motion.div
              className="flex min-w-0 flex-1 flex-col"
              initial={false}
              animate={{ marginLeft: target.headerGap }}
              transition={moving}
            >
              <span className="work-modal-date text-caption1 text-text-muted">
                {company.dateLabel}
              </span>
              <motion.h2
                id={titleId}
                className="text-title1 font-normal text-text-primary"
                initial={false}
                animate={{
                  fontSize: target.titleSize,
                  lineHeight: `${target.titleLine}px`,
                  marginTop: target.nameGap,
                }}
                transition={moving}
              >
                {company.name}
              </motion.h2>
            </motion.div>
          </div>

          <motion.div
            className="relative"
            initial={false}
            animate={{ marginTop: target.gap }}
            transition={moving}
          >
            <motion.div
              className="flex flex-col gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === "closing" ? 0 : 1 }}
              transition={moving}
            >
              <TextBlocks chunks={chunks} />
            </motion.div>
            <motion.div
              aria-hidden
              className="absolute inset-x-0 top-0 flex flex-col gap-2"
              initial={{ opacity: 1 }}
              animate={{ opacity: phase === "closing" ? 1 : 0 }}
              transition={moving}
            >
              {company.role.trim() ? (
                <p className="card-role text-body text-text-primary">{company.role}</p>
              ) : null}
              {company.description.trim() ? (
                <p className="card-copy text-subheadline text-text-secondary">
                  {company.description}
                </p>
              ) : null}
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </>,
    document.body,
  );
}
