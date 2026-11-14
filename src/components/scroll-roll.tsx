"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Content rolls onto the screen at its edges (SDD §4.5).
 *
 * A block marked `data-roll` is flat everywhere except a narrow band at the
 * top and bottom of the screen. While its leading edge is inside the bottom
 * band it is tipped and stretched a little, and settles flat as it moves in;
 * the same happens in reverse at the top as its last edge leaves. Two soft
 * gradients in the page color cover those bands, so content seems to come
 * out of the page instead of being cut by the screen edge.
 *
 * The amount depends only on where the block is, so it follows the scroll in
 * both directions, always. It eases toward that amount over a few frames, so
 * a wheel step does not snap.
 *
 * Cost: one passive scroll listener and one frame loop that stops when
 * nothing moves. Only blocks near the screen are tracked. A frame reads
 * layout for those few blocks, then writes two CSS variables each; the
 * transform itself is in globals.css and runs on the compositor.
 */
const SELECTOR = "[data-roll]";
/** Time constant of the easing toward the target, ms. */
const SMOOTH_MS = 90;

/** Distance from the top of the page, ignoring transforms (ours included). */
function pageTop(el: HTMLElement) {
  let top = 0;
  let node: HTMLElement | null = el;
  while (node) {
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return top;
}

function clamp01(value: number) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

/** Slow start and slow end, so a block does not snap out of flat. */
function ease(value: number) {
  return value * value * (3 - 2 * value);
}

function flatten(el: HTMLElement) {
  if (!el.hasAttribute("data-rolling")) return;
  el.removeAttribute("data-rolling");
  el.style.removeProperty("--roll");
  el.style.removeProperty("--roll-abs");
}

export function ScrollRoll() {
  const pathname = usePathname() ?? "/";
  // The admin is a work tool: no motion and no fades over its forms.
  const off = pathname === "/admin" || pathname.startsWith("/admin/");

  useEffect(() => {
    if (off) return;
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const tracked = new Set<HTMLElement>();
    const near = new Set<HTMLElement>();
    const current = new Map<HTMLElement, number>();
    let frame = 0;
    let last = 0;
    let scanTimer = 0;

    const update = (now: number) => {
      frame = 0;
      const dt = last ? Math.min(now - last, 64) : 16;
      last = now;
      const blend = 1 - Math.exp(-dt / SMOOTH_MS);
      const viewport = window.innerHeight;
      const scroll = window.scrollY;
      const maxScroll = root.scrollHeight - viewport;

      // The gradients fade out at the very top and bottom of the page, where
      // nothing is hidden beyond the edge.
      root.style.setProperty("--edge-top", clamp01(scroll / 140).toFixed(3));
      root.style.setProperty(
        "--edge-bottom",
        clamp01((maxScroll - scroll) / 140).toFixed(3),
      );

      if (reduced.matches) {
        for (const el of tracked) flatten(el);
        current.clear();
        last = 0;
        return;
      }

      const band = Math.max(120, Math.min(220, viewport * 0.24));
      // Read everything, then write: no layout thrash inside the loop.
      const reads: [HTMLElement, number][] = [];
      for (const el of near) {
        const height = el.offsetHeight;
        if (height === 0) {
          reads.push([el, 0]);
          continue;
        }
        const top = pageTop(el) - scroll;
        // 1 while the top edge is right at the bottom of the screen, 0 once
        // it has come a band's height in. Mirrored for the top of the screen.
        const entering = clamp01(1 - (viewport - top) / band);
        const leaving = clamp01(1 - (top + height) / band);
        reads.push([el, ease(entering) - ease(leaving)]);
      }

      let moving = false;
      for (const [el, target] of reads) {
        const from = current.get(el);
        // A block that just came into range starts at its target: easing in
        // from flat would show as a jolt at the screen edge.
        let value = from === undefined ? target : from + (target - from) * blend;
        if (Math.abs(target - value) < 0.003) value = target;
        else moving = true;
        current.set(el, value);
        if (Math.abs(value) < 0.003) {
          flatten(el);
          continue;
        }
        el.style.setProperty("--roll", value.toFixed(3));
        el.style.setProperty("--roll-abs", Math.abs(value).toFixed(3));
        el.setAttribute("data-rolling", "");
      }

      if (moving) frame = requestAnimationFrame(update);
      else last = 0;
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            near.add(el);
          } else {
            near.delete(el);
            current.delete(el);
            flatten(el);
          }
        }
        schedule();
      },
      // A little beyond the screen, so a block is already tipped when it shows.
      { rootMargin: "20% 0px" },
    );

    // Cards swap their element when they come alive, and case pages load in
    // pieces, so the set of blocks is re-read whenever the page changes.
    const scan = () => {
      scanTimer = 0;
      const found = new Set(document.querySelectorAll<HTMLElement>(SELECTOR));
      for (const el of tracked) {
        if (found.has(el)) continue;
        observer.unobserve(el);
        tracked.delete(el);
        near.delete(el);
        current.delete(el);
      }
      for (const el of found) {
        if (tracked.has(el)) continue;
        tracked.add(el);
        observer.observe(el);
      }
      schedule();
    };
    const queueScan = () => {
      if (!scanTimer) scanTimer = window.setTimeout(scan, 120);
    };

    const mutations = new MutationObserver(queueScan);
    mutations.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    scan();

    return () => {
      mutations.disconnect();
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
      if (scanTimer) window.clearTimeout(scanTimer);
      for (const el of tracked) flatten(el);
      root.style.removeProperty("--edge-top");
      root.style.removeProperty("--edge-bottom");
    };
  }, [pathname, off]);

  if (off) return null;
  return (
    <>
      <div aria-hidden className="edge-fade edge-fade-top" />
      <div aria-hidden className="edge-fade edge-fade-bottom" />
    </>
  );
}
