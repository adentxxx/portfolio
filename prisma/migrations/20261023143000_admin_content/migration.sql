-- AlterTable
ALTER TABLE "Project" ADD COLUMN "createdMonth" INTEGER;
ALTER TABLE "Project" ADD COLUMN "createdYear" INTEGER;

-- CreateTable
CREATE TABLE "CompanyBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "text" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL,
    CONSTRAINT "CompanyBlock_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "dateLabel" TEXT NOT NULL,
    "startMonth" INTEGER,
    "startYear" INTEGER,
    "endMonth" INTEGER,
    "endYear" INTEGER,
    "ongoing" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT NOT NULL,
    "logoSrc" TEXT NOT NULL,
    "url" TEXT,
    "order" INTEGER NOT NULL,
    "bloubEmotion" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Company_bloubEmotion_fkey" FOREIGN KEY ("bloubEmotion") REFERENCES "BloubEmotion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Company" ("bloubEmotion", "dateLabel", "description", "id", "logoSrc", "name", "order", "published", "role", "url") SELECT "bloubEmotion", "dateLabel", "description", "id", "logoSrc", "name", "order", "published", "role", "url" FROM "Company";
DROP TABLE "Company";
ALTER TABLE "new_Company" RENAME TO "Company";
CREATE TABLE "new_ProjectSection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'legacy',
    "heading" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "text" TEXT NOT NULL DEFAULT '',
    "imageSrc" TEXT,
    "sortOrder" INTEGER NOT NULL,
    CONSTRAINT "ProjectSection_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProjectSection" ("body", "heading", "id", "imageSrc", "projectId", "sortOrder") SELECT "body", "heading", "id", "imageSrc", "projectId", "sortOrder" FROM "ProjectSection";
DROP TABLE "ProjectSection";
ALTER TABLE "new_ProjectSection" RENAME TO "ProjectSection";
CREATE TABLE "new_SiteSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "introHeadline" TEXT NOT NULL,
    "introBio" TEXT NOT NULL,
    "avatarSrc" TEXT NOT NULL,
    "avatarFacesJson" TEXT NOT NULL DEFAULT '[]',
    "introLinksJson" TEXT NOT NULL,
    "contactHeadline" TEXT NOT NULL,
    "contactSubline" TEXT NOT NULL,
    "contactLinksJson" TEXT NOT NULL
);
INSERT INTO "new_SiteSettings" ("avatarSrc", "contactHeadline", "contactLinksJson", "contactSubline", "id", "introBio", "introHeadline", "introLinksJson") SELECT "avatarSrc", "contactHeadline", "contactLinksJson", "contactSubline", "id", "introBio", "introHeadline", "introLinksJson" FROM "SiteSettings";
DROP TABLE "SiteSettings";
ALTER TABLE "new_SiteSettings" RENAME TO "SiteSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Keep the shipped portraits available in the admin until the owner uploads new ones.
UPDATE "SiteSettings"
SET "avatarFacesJson" = '["/faces/face_1.png","/faces/face_2.png","/faces/face_3.png","/faces/face_4.png"]'
WHERE "avatarFacesJson" = '[]';
