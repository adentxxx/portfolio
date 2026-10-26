/**
 * Bloub animation engine — vendored from https://github.com/jeremy-prt/bloub
 * (MIT, see ./LICENSE). `src/bot/` of the upstream repo, copied verbatim minus
 * tests and the montage editor (`cycles.ts`).
 *
 * Framework-free and clock-free: `BotEngine.sample(t)` is a pure function of
 * time. The React renderer lives in `@/components/portfolio/bloub-bot`.
 * Colours are NOT taken from `skins.ts`: the renderer binds body / eyes /
 * decor to the design tokens (`accent/primary`, `surface/page`, …).
 */
export { BotEngine, type BotFrame } from "./engine";
export { DEMI_VIEWBOX, RAYON } from "./repere";
export {
  POSES,
  SEQUENCE,
  STATE_BY_ID,
  STATES,
  type StateId,
} from "./states";
export {
  DEFAULT_EXPRESSION,
  EXPRESSION_BY_ID,
  EXPRESSIONS,
  type ExpressionId,
} from "./expressions";
export { DEFAULT_SHAPE, SHAPE_BY_ID, SHAPES, type ShapeId } from "./skins";

import { SEQUENCE, STATE_BY_ID, type StateId } from "./states";
import { EXPRESSION_BY_ID, type ExpressionId } from "./expressions";
import { DEFAULT_SHAPE, SHAPE_BY_ID, type ShapeId } from "./skins";

/** Narrow an arbitrary DB string to a catalogue state (fallback `idle`). */
export function toStateId(raw: string | null | undefined): StateId {
  return raw && STATE_BY_ID.has(raw as StateId) ? (raw as StateId) : "idle";
}

/** Narrow an arbitrary DB string to a rest expression (fallback `null` = measured). */
export function toExpressionId(
  raw: string | null | undefined,
): ExpressionId | null {
  return raw && EXPRESSION_BY_ID.has(raw) ? (raw as ExpressionId) : null;
}

/** Narrow an arbitrary DB string to a customizer shape (fallback circle). */
export function toShapeId(raw: string | null | undefined): ShapeId {
  return raw && SHAPE_BY_ID.has(raw) ? (raw as ShapeId) : DEFAULT_SHAPE;
}

/** States selectable in the admin: the measured catalogue, without the UI-only `swirl`. */
export const SELECTABLE_STATES: readonly StateId[] = SEQUENCE;
