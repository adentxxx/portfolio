-- AlterTable
ALTER TABLE "ProjectSection" ADD COLUMN "videoAutoplay" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ProjectSection" ADD COLUMN "videoMuted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ProjectSection" ADD COLUMN "videoLoop" BOOLEAN NOT NULL DEFAULT false;
