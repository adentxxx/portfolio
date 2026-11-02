-- NDA cases stay public as a teaser and stay out of search indexes.

ALTER TABLE "Project" ADD COLUMN "nda" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Project" ADD COLUMN "ndaText" TEXT NOT NULL DEFAULT '';
