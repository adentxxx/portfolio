"use client";

import {
  BotEngine,
  DEMI_VIEWBOX,
  EXPRESSION_BY_ID,
  POSES,
  RAYON,
  SHAPE_BY_ID,
  type BotFrame,
  type ExpressionId,
  type ShapeId,
  type StateId,
} from "@/lib/bloub-engine";
import { useEffect, useId, useRef, useState } from "react";

type BloubBotProps = {
  /** Catalogue state (emotion) to show. Changing it morphs the body. */
  state: StateId;
  /** Rest expression for `baseFace` states (`idle`); null = the measured one. */
  expression?: ExpressionId | null;
  /** Customizer silhouette. Null keeps the silhouette drawn by the animation. */
  shape?: ShapeId | null;
  /** Rendered diameter of the ball in px (rings may overflow, that's intended). */
  size?: number;
  /**
   * Morph in from this state on mount (Arrive: a plain ball turns into the
   * emotion). Omit to start directly in `state`.
   */
  entryFrom?: StateId | null;
  /** No animation loop: a single readable frame (`prefers-reduced-motion`). */
  frozen?: boolean;
  /** Keep the current frame but stop the loop (e.g. while hidden off-screen). */
  paused?: boolean;
  className?: string;
  label?: string;
};

/** Longest frame step the scene clock accepts (background tab → no jump). */
const MAX_DT = 0.064;

/** Engine units per design pixel: Figma draws the ball 44px wide. */
const GLOW_PX = RAYON / 22;
const GLOW_OFFSET = 4 * GLOW_PX;
const GLOW_RADIUS = 30 * GLOW_PX;
/**
 * [offset, alpha] along that radius: white 60% under a blur of 8px (sigma 4)
 * across the rim, which sits 22px from the centre of the gradient.
 */
const GLOW_STOPS: ReadonlyArray<readonly [number, number]> = [
  [0.4, 0],
  [0.467, 0.014],
  [0.533, 0.04],
  [0.6, 0.095],
  [0.667, 0.185],
  [0.733, 0.3],
  [0.8, 0.415],
  [0.867, 0.505],
  [0.933, 0.56],
  [1, 0.586],
];

/**
 * SVG renderer for `BotEngine` — a React port of the upstream `BloubBot.vue`.
 *
 * Colours come from the design tokens, not from the engine's `skins.ts`:
 * - body       → `accent/primary`
 * - eyes       → holes in the body showing a `surface/page` backing
 * - rings/dots → `accent/primary` (+ `accent/primary-hover` gradient)
 * - notif dot  → `accent/information`
 * So the theme toggle re-colours the bloub without re-rendering a frame.
 */
function shapeRadii(shape: ShapeId | null) {
  return shape ? (SHAPE_BY_ID.get(shape)?.radii ?? null) : null;
}

export function BloubBot({
  state,
  expression = null,
  shape = null,
  size = 44,
  entryFrom = null,
  frozen = false,
  paused = false,
  className,
  label = "bloub",
}: BloubBotProps) {
  const uid = useId();
  const maskId = `bloub-mask-${uid}`;
  const gradId = `bloub-grad-${uid}`;
  const glowId = `bloub-glow-${uid}`;

  const engineRef = useRef<BotEngine | null>(null);
  const clockRef = useRef(0);
  const rafRef = useRef(0);
  const lastRef = useRef(0);

  // Deterministic first frame: identical on the server and on hydration.
  const [frame, setFrame] = useState<BotFrame>(() => {
    const expr = expression ? (EXPRESSION_BY_ID.get(expression) ?? null) : null;
    const start = entryFrom && entryFrom !== state ? entryFrom : state;
    const engine = new BotEngine(RAYON, start, shapeRadii(shape), expr);
    let t0 = 0;
    if (start !== state) {
      // Arrive: begin as `entryFrom`, morph towards `state` from t = 0.
      engine.setState(state, 0);
    } else {
      // Idle / frozen: open on the state's most readable pose.
      t0 = POSES[state];
    }
    engineRef.current = engine;
    clockRef.current = t0;
    return engine.sample(t0);
  });

  // Prop-driven changes are dated with the scene clock so they morph.
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || engine.state === state) return;
    engine.setState(state, clockRef.current);
    if (frozen) setFrame(engine.sample(clockRef.current + POSES[state]));
  }, [state, frozen]);

  const appliedExpression = useRef(expression);
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || appliedExpression.current === expression) return;
    appliedExpression.current = expression;
    engine.setExpression(
      expression ? (EXPRESSION_BY_ID.get(expression) ?? null) : null,
      clockRef.current,
    );
    if (frozen) {
      // Finish the morph: a frozen frame never ticks, so a mid-blend would stick.
      clockRef.current += BotEngine.SHAPE_MORPH;
      setFrame(engine.sample(clockRef.current));
    }
  }, [expression, frozen]);

  const appliedShape = useRef(shape);
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || appliedShape.current === shape) return;
    appliedShape.current = shape;
    engine.setShape(shapeRadii(shape), clockRef.current);
    if (frozen) {
      clockRef.current += BotEngine.SHAPE_MORPH;
      setFrame(engine.sample(clockRef.current));
    }
  }, [shape, frozen]);

  useEffect(() => {
    if (frozen || paused) return;
    const engine = engineRef.current;
    if (!engine) return;

    const tick = (ms: number) => {
      rafRef.current = requestAnimationFrame(tick);
      const dt = lastRef.current
        ? Math.min((ms - lastRef.current) / 1000, MAX_DT)
        : 0;
      lastRef.current = ms;
      clockRef.current += dt;
      setFrame(engine.sample(clockRef.current));
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      lastRef.current = 0;
    };
  }, [frozen, paused]);

  const VB = DEMI_VIEWBOX;
  const R = RAYON;
  const ink = "var(--accent-primary)";
  const paper = "var(--surface-page)";

  const renderDots = (keyPrefix: string) =>
    frame.dots.map((dot, i) => {
      // Depth haze: upstream mixes ink→paper; on a token colour that is just opacity.
      const opacity = dot.opacity * (dot.depth ?? 1);
      if (dot.d) {
        return (
          <path
            key={`${keyPrefix}${i}`}
            d={dot.d}
            fill={ink}
            opacity={opacity}
            transform={`translate(${dot.x} ${dot.y}) rotate(${dot.rot ?? 0}) scale(${R})`}
          />
        );
      }
      return (
        <circle
          key={`${keyPrefix}${i}`}
          cx={dot.x}
          cy={dot.y}
          r={dot.r}
          fill={ink}
          opacity={opacity}
        />
      );
    });

  const renderArcs = (part: "front" | "back") => (
    <g fill="none" strokeLinecap="round">
      {frame.arcs.map((arc) => (
        <path
          key={`${part}${arc.id}`}
          d={arc[part]}
          stroke={`url(#${gradId})`}
          strokeWidth={arc.width}
          opacity={arc.opacity}
        />
      ))}
    </g>
  );

  return (
    <svg
      width={size}
      height={size}
      // The ball is radius RAYON; decor (rings, comet) lives outside and may overflow.
      viewBox={`${-R} ${-R} ${R * 2} ${R * 2}`}
      style={{ overflow: "visible" }}
      className={className}
      role="img"
      aria-label={label}
    >
      <defs>
        {/* Eyes are holes in the body (not shapes on top): the silhouette clips them for free. */}
        <mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          x={-VB}
          y={-VB}
          width={VB * 2}
          height={VB * 2}
        >
          <path d={frame.bodyPath} fill="#fff" />
          {frame.eyes.map((eye, i) => (
            <path
              key={i}
              d={eye.d}
              transform={eye.matrix}
              opacity={eye.alpha}
              fill="#000"
            />
          ))}
          {frame.notch ? (
            <circle
              cx={frame.notch.x}
              cy={frame.notch.y}
              r={frame.notch.r}
              fill="#000"
            />
          ) : null}
        </mask>
        <linearGradient
          id={gradId}
          gradientUnits="userSpaceOnUse"
          x1={-VB}
          y1={0}
          x2={VB}
          y2={0}
        >
          <stop offset="0" style={{ stopColor: "var(--accent-primary)" }} />
          <stop
            offset="1"
            style={{ stopColor: "var(--accent-primary-hover)" }}
          />
        </linearGradient>
        {/*
          Inner glow, Figma 405:13014: inset 0 4px 8px, white 60%, on a 44px
          ball. An inset shadow is the outside of the shape, moved down and
          blurred; for a ball that is a ring centred 4px lower. A gradient
          draws it with no filter, so it costs nothing per frame.
        */}
        <radialGradient
          id={glowId}
          gradientUnits="userSpaceOnUse"
          cx={0}
          cy={GLOW_OFFSET}
          r={GLOW_RADIUS}
        >
          {GLOW_STOPS.map(([offset, alpha]) => (
            <stop
              key={offset}
              offset={offset}
              stopOpacity={alpha}
              style={{ stopColor: "var(--bloub-glow)" }}
            />
          ))}
        </radialGradient>
      </defs>

      {/* back half of the orbits: drawn before the body, so occluded by it */}
      {renderArcs("back")}

      {frame.dotsBehind ? <g>{renderDots("pb")}</g> : null}

      <g opacity={frame.bodyAlpha}>
        {/*
          Opaque backing in the page colour under the body: the eyes are holes,
          and without it the rings passing behind the ball would show through them.
          It is also what makes the eyes `surface/page` in both themes.
        */}
        <path d={frame.bodyPath} fill={paper} />
        <g mask={`url(#${maskId})`}>
          <rect x={-VB} y={-VB} width={VB * 2} height={VB * 2} fill={ink} />
          <rect
            x={-VB}
            y={-VB}
            width={VB * 2}
            height={VB * 2}
            fill={`url(#${glowId})`}
          />
        </g>
      </g>

      {!frame.dotsBehind ? <g>{renderDots("pf")}</g> : null}

      {frame.notif ? (
        <circle
          cx={frame.notif.x}
          cy={frame.notif.y}
          r={frame.notif.r}
          fill="var(--accent-information)"
        />
      ) : null}

      {/* front half of the orbits */}
      {renderArcs("front")}
    </svg>
  );
}
