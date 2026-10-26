-- Per-project bloub customizer: shape, animation, rest expression.
-- Existing rows copy state/expression from the catalogue emotion they pointed at.
-- Shape stays the circle, which is what the renderer drew before this column existed.

ALTER TABLE "Project" ADD COLUMN "bloubShape" TEXT NOT NULL DEFAULT 'cercle';
ALTER TABLE "Project" ADD COLUMN "bloubState" TEXT NOT NULL DEFAULT 'idle';
ALTER TABLE "Project" ADD COLUMN "bloubExpression" TEXT;

UPDATE "Project"
SET
  "bloubState" = (
    SELECT "state" FROM "BloubEmotion"
    WHERE "BloubEmotion"."id" = "Project"."bloubEmotion"
  ),
  "bloubExpression" = (
    SELECT "expression" FROM "BloubEmotion"
    WHERE "BloubEmotion"."id" = "Project"."bloubEmotion"
  )
WHERE EXISTS (
  SELECT 1 FROM "BloubEmotion"
  WHERE "BloubEmotion"."id" = "Project"."bloubEmotion"
);
