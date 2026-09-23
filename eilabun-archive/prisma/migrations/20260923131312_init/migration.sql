-- CreateTable
CREATE TABLE "Recording" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "originalTitle" TEXT,
    "titleAr" TEXT,
    "titleEn" TEXT,
    "titleHe" TEXT,
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "subcategory" TEXT,
    "event" TEXT,
    "date" DATETIME,
    "year" INTEGER,
    "church" TEXT,
    "location" TEXT NOT NULL DEFAULT 'Eilabun',
    "language" TEXT NOT NULL DEFAULT 'ar',
    "priest" TEXT,
    "choir" TEXT,
    "source" TEXT NOT NULL DEFAULT 'YOUTUBE',
    "sourceUrl" TEXT NOT NULL,
    "canonicalUrl" TEXT NOT NULL,
    "youtubeVideoId" TEXT,
    "channelName" TEXT,
    "channelUrl" TEXT,
    "publishedAt" DATETIME,
    "thumbnailUrl" TEXT,
    "duration" INTEGER,
    "description" TEXT,
    "discoveredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "audioQuality" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "notes" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "verification" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "isAuthorized" BOOLEAN NOT NULL DEFAULT false,
    "rightsNotes" TEXT,
    "embeddable" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AudioAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recordingId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "parentId" TEXT,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "settings" TEXT,
    "rightsStatement" TEXT,
    "status" TEXT NOT NULL DEFAULT 'READY',
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AudioAsset_recordingId_fkey" FOREIGN KEY ("recordingId") REFERENCES "Recording" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "Recording_canonicalUrl_key" ON "Recording"("canonicalUrl");

-- CreateIndex
CREATE UNIQUE INDEX "Recording_youtubeVideoId_key" ON "Recording"("youtubeVideoId");

-- CreateIndex
CREATE INDEX "Recording_category_idx" ON "Recording"("category");

-- CreateIndex
CREATE INDEX "Recording_year_idx" ON "Recording"("year");

-- CreateIndex
CREATE INDEX "Recording_verification_idx" ON "Recording"("verification");

-- CreateIndex
CREATE INDEX "Recording_discoveredAt_idx" ON "Recording"("discoveredAt");

-- CreateIndex
CREATE INDEX "AudioAsset_recordingId_idx" ON "AudioAsset"("recordingId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");
