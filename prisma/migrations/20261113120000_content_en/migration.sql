-- English copy next to the Russian one. Empty means "show the Russian text".
ALTER TABLE "Company" ADD COLUMN "nameEn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Company" ADD COLUMN "roleEn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Company" ADD COLUMN "descriptionEn" TEXT NOT NULL DEFAULT '';

ALTER TABLE "CompanyBlock" ADD COLUMN "textEn" TEXT NOT NULL DEFAULT '';

ALTER TABLE "Project" ADD COLUMN "titleEn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Project" ADD COLUMN "descriptionEn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Project" ADD COLUMN "summaryEn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Project" ADD COLUMN "ndaTitleEn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Project" ADD COLUMN "ndaTextEn" TEXT NOT NULL DEFAULT '';

ALTER TABLE "ProjectSection" ADD COLUMN "textEn" TEXT NOT NULL DEFAULT '';

ALTER TABLE "SiteSettings" ADD COLUMN "introHeadlineEn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSettings" ADD COLUMN "introBioEn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSettings" ADD COLUMN "contactHeadlineEn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSettings" ADD COLUMN "contactSublineEn" TEXT NOT NULL DEFAULT '';
