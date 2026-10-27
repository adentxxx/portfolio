import {
  EXPRESSION_BY_ID,
  SELECTABLE_STATES,
  SHAPE_BY_ID,
  type StateId,
} from "@/lib/bloub-engine";

/** Admin payload for a card's bloub. Null means the request is invalid. */
export function readBloubLook(shape: unknown, state: unknown, expression: unknown) {
  if (typeof shape !== "string" || !SHAPE_BY_ID.has(shape)) return null;
  if (
    typeof state !== "string" ||
    !(SELECTABLE_STATES as readonly string[]).includes(state)
  ) {
    return null;
  }
  if (
    expression != null &&
    (typeof expression !== "string" || !EXPRESSION_BY_ID.has(expression))
  ) {
    return null;
  }
  return {
    bloubShape: shape,
    bloubState: state as StateId,
    bloubExpression: typeof expression === "string" ? expression : null,
  };
}
