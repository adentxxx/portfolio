-- BloubEmotion: static SVG assets → states of the vendored bloub engine.
-- Drops `assetSrc` / `idleAnimation`, adds `state` (default "idle") and `expression`.
-- Existing demo rows are mapped onto engine states so Company/Project FKs stay valid.

PRAGMA foreign_keys=OFF;

-- RedefineTables
CREATE TABLE "new_BloubEmotion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'idle',
    "expression" TEXT
);

INSERT INTO "new_BloubEmotion" ("id", "label", "state", "expression")
SELECT
    "id",
    "label",
    CASE "id"
        WHEN 'wave'  THEN 'wink'
        WHEN 'focus' THEN 'thinking'
        WHEN 'spark' THEN 'orbit'
        ELSE 'idle'
    END,
    CASE "id"
        WHEN 'calm' THEN 'heureux'
        ELSE NULL
    END
FROM "BloubEmotion";

DROP TABLE "BloubEmotion";
ALTER TABLE "new_BloubEmotion" RENAME TO "BloubEmotion";

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
