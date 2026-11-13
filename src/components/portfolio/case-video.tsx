"use client";

import { useUi } from "@/hooks/use-locale";
import { publicPath } from "@/lib/public-path";
import { useEffect, useRef, useState } from "react";

export function CaseVideo({
  src,
  poster,
  autoplay,
  muted,
  loop,
  controls,
}: {
  src: string;
  poster: string | null;
  autoplay: boolean;
  muted: boolean;
  loop: boolean;
  controls: boolean;
}) {
  const ui = useUi();
  const [motionReady, setMotionReady] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [visualReady, setVisualReady] = useState(false);
  const [ratio, setRatio] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const posterSrc = poster ? publicPath(poster) : undefined;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    setMotionReady(true);
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!posterSrc) return;
    let cancelled = false;
    const img = new window.Image();
    const show = () => {
      if (cancelled || img.naturalWidth <= 0) return;
      setRatio(img.naturalWidth / img.naturalHeight);
      setVisualReady(true);
    };
    img.onload = show;
    img.src = posterSrc;
    if (img.complete) show();
    return () => {
      cancelled = true;
    };
  }, [posterSrc]);

  const play = autoplay && motionReady && !reduceMotion;
  const silent = muted || play;

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;
    node.muted = silent;
    const show = () => setVisualReady(true);
    const measure = () => {
      if (node.videoWidth > 0) setRatio(node.videoWidth / node.videoHeight);
    };
    measure();
    if (node.readyState >= 2) show();
    else if (!posterSrc) setVisualReady(false);
    node.addEventListener("loadedmetadata", measure);
    node.addEventListener("loadeddata", show);
    node.addEventListener("error", show);
    return () => {
      node.removeEventListener("loadedmetadata", measure);
      node.removeEventListener("loadeddata", show);
      node.removeEventListener("error", show);
    };
  }, [src, posterSrc, silent, play, loop, controls]);

  function toggle(node: HTMLVideoElement) {
    if (node.paused) void node.play();
    else node.pause();
  }

  return (
    <div
      className="relative w-full overflow-hidden rounded-[24px] bg-surface-control"
      style={{ aspectRatio: ratio ? String(ratio) : "116 / 50" }}
    >
      {visualReady ? null : (
        <div className="media-skeleton absolute inset-0 z-10" aria-hidden />
      )}
    <video
      key={`${src}-${posterSrc ?? ""}-${play}-${silent}-${loop}-${controls}`}
      src={publicPath(src)}
      poster={posterSrc}
      controls={controls}
      playsInline
      autoPlay={play}
      muted={silent}
      loop={loop}
      preload={play ? "auto" : posterSrc ? "none" : "metadata"}
      ref={videoRef}
      onError={() => setVisualReady(true)}
      className={
        controls
          ? "absolute inset-0 size-full object-contain"
          : "video-clean absolute inset-0 size-full cursor-pointer object-contain"
      }
      tabIndex={controls ? undefined : 0}
      aria-label={controls ? undefined : playing ? ui.videoPause : ui.videoPlay}
      onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)}
      onClick={controls ? undefined : (event) => toggle(event.currentTarget)}
      onKeyDown={
        controls
          ? undefined
          : (event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              toggle(event.currentTarget);
            }
      }
    />
    </div>
  );
}
