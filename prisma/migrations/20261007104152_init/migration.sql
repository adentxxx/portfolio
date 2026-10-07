-- CreateTable
CREATE TABLE "BloubEmotion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "assetSrc" TEXT NOT NULL,
    "idleAnimation" TEXT
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "dateLabel" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "logoSrc" TEXT NOT NULL,
    "url" TEXT,
    "order" INTEGER NOT NULL,
    "bloubEmotion" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Company_bloubEmotion_fkey" FOREIGN KEY ("bloubEmotion") REFERENCES "BloubEmotion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dateLabel" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "logoSrc" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "bloubEmotion" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "heroImage" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Project_bloubEmotion_fkey" FOREIGN KEY ("bloubEmotion") REFERENCES "BloubEmotion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectSection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "heading" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "imageSrc" TEXT,
    "sortOrder" INTEGER NOT NULL,
    CONSTRAINT "ProjectSection_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "introHeadline" TEXT NOT NULL,
    "introBio" TEXT NOT NULL,
    "avatarSrc" TEXT NOT NULL,
    "introLinksJson" TEXT NOT NULL,
    "contactHeadline" TEXT NOT NULL,
    "contactSubline" TEXT NOT NULL,
    "contactLinksJson" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");
