-- CreateTable
CREATE TABLE "CarCandidate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "variant" TEXT,
    "trim" TEXT,
    "modelYear" INTEGER,
    "category" TEXT,
    "normalised" TEXT NOT NULL,
    "possibleDuplicateOf" TEXT,
    "duplicateReason" TEXT,
    "matchScore" INTEGER,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedAt" DATETIME,
    "reviewNote" TEXT,
    "mergedInto" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "fetchedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CrawlLogEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "carId" TEXT,
    "operation" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "durationMs" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CarSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "robotsStatus" TEXT NOT NULL DEFAULT 'unchecked',
    "robotsCheckedAt" DATETIME,
    "robotsNote" TEXT,
    "trustRank" INTEGER NOT NULL DEFAULT 50,
    "crawlIntervalMinutes" INTEGER NOT NULL DEFAULT 1440,
    "requestDelayMs" INTEGER NOT NULL DEFAULT 1500,
    "lastCrawledAt" DATETIME,
    "schedule" TEXT NOT NULL DEFAULT 'daily',
    "lastSuccessAt" DATETIME,
    "lastFailureAt" DATETIME,
    "lastError" TEXT,
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "avgResponseMs" INTEGER,
    "lastChangedAt" DATETIME,
    "staleAfterDays" INTEGER NOT NULL DEFAULT 7,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_CarSource" ("baseUrl", "crawlIntervalMinutes", "createdAt", "id", "isEnabled", "lastCrawledAt", "name", "requestDelayMs", "robotsCheckedAt", "robotsNote", "robotsStatus", "trustRank", "updatedAt") SELECT "baseUrl", "crawlIntervalMinutes", "createdAt", "id", "isEnabled", "lastCrawledAt", "name", "requestDelayMs", "robotsCheckedAt", "robotsNote", "robotsStatus", "trustRank", "updatedAt" FROM "CarSource";
DROP TABLE "CarSource";
ALTER TABLE "new_CarSource" RENAME TO "CarSource";
CREATE UNIQUE INDEX "CarSource_name_key" ON "CarSource"("name");
CREATE INDEX "CarSource_isEnabled_idx" ON "CarSource"("isEnabled");
CREATE TABLE "new_CrawlRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'running',
    "recordsFound" INTEGER NOT NULL DEFAULT 0,
    "recordsStored" INTEGER NOT NULL DEFAULT 0,
    "recordsFailed" INTEGER NOT NULL DEFAULT 0,
    "recordsChanged" INTEGER NOT NULL DEFAULT 0,
    "recordsUnchanged" INTEGER NOT NULL DEFAULT 0,
    "recordsPendingReview" INTEGER NOT NULL DEFAULT 0,
    "candidatesFound" INTEGER NOT NULL DEFAULT 0,
    "trigger" TEXT NOT NULL DEFAULT 'manual',
    "durationMs" INTEGER,
    "errors" TEXT,
    "notes" TEXT
);
INSERT INTO "new_CrawlRun" ("completedAt", "errors", "id", "notes", "recordsFailed", "recordsFound", "recordsStored", "sourceId", "startedAt", "status") SELECT "completedAt", "errors", "id", "notes", "recordsFailed", "recordsFound", "recordsStored", "sourceId", "startedAt", "status" FROM "CrawlRun";
DROP TABLE "CrawlRun";
ALTER TABLE "new_CrawlRun" RENAME TO "CrawlRun";
CREATE INDEX "CrawlRun_sourceId_startedAt_idx" ON "CrawlRun"("sourceId", "startedAt");
CREATE INDEX "CrawlRun_status_idx" ON "CrawlRun"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "CarCandidate_status_confidence_idx" ON "CarCandidate"("status", "confidence");

-- CreateIndex
CREATE INDEX "CarCandidate_possibleDuplicateOf_idx" ON "CarCandidate"("possibleDuplicateOf");

-- CreateIndex
CREATE UNIQUE INDEX "CarCandidate_sourceId_brand_model_variant_modelYear_key" ON "CarCandidate"("sourceId", "brand", "model", "variant", "modelYear");

-- CreateIndex
CREATE INDEX "CrawlLogEntry_runId_createdAt_idx" ON "CrawlLogEntry"("runId", "createdAt");

-- CreateIndex
CREATE INDEX "CrawlLogEntry_sourceId_status_createdAt_idx" ON "CrawlLogEntry"("sourceId", "status", "createdAt");
