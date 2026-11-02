-- Editable heading on an NDA case page. Empty means the heading is hidden.

ALTER TABLE "Project" ADD COLUMN "ndaTitle" TEXT NOT NULL DEFAULT '';
