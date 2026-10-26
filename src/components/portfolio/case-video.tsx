"use client";

import { publicPath } from "@/lib/public-path";
import { useEffect, useState } from "react";

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
  const [motionReady, setMotionReady] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    setMotionReady(true);
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const play = autoplay && motionReady && !reduceMotion;
  const silent = muted || play;
  const posterSrc = poster ? publicPath(poster) : undefined;

  function toggle(node: HTMLVideoElement) {
    if (node.paused) void node.play();
    else node.pause();
  }

  return (
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
      ref={(node) => {
        if (node) node.muted = silent;
      }}
      className={
        controls
          ? "w-full rounded-[24px] bg-surface-control"
          : "video-clean w-full cursor-pointer rounded-[24px] bg-surface-control"
      }
      tabIndex={controls ? undefined : 0}
      aria-label={controls ? undefined : playing ? "Пауза" : "Воспроизвести видео"}
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
  );
}
