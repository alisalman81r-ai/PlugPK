-- CreateTable
CREATE TABLE "CarSource" (
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
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CarSourceRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "externalId" TEXT,
    "runId" TEXT NOT NULL,
    "fetchedAt" DATETIME NOT NULL,
    "httpStatus" INTEGER,
    "raw" TEXT NOT NULL,
    "normalised" TEXT,
    "contentHash" TEXT NOT NULL,
    "extractionStatus" TEXT NOT NULL DEFAULT 'ok',
    "fieldsFound" INTEGER NOT NULL DEFAULT 0,
    "fieldsExpected" INTEGER NOT NULL DEFAULT 0,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "reviewStatus" TEXT NOT NULL DEFAULT 'pending',
    "reviewedAt" DATETIME,
    "reviewNote" TEXT,
    "matchedCarId" TEXT,
    "matchStrategy" TEXT,
    "matchScore" INTEGER,
    "matchCandidates" TEXT,
    "errorMessage" TEXT,
    "errorFields" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CarSourceRecord_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "CarSource" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CarSourceRecord_matchedCarId_fkey" FOREIGN KEY ("matchedCarId") REFERENCES "Car" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CarSource_name_key" ON "CarSource"("name");

-- CreateIndex
CREATE INDEX "CarSource_isEnabled_idx" ON "CarSource"("isEnabled");

-- CreateIndex
CREATE INDEX "CarSourceRecord_sourceId_externalId_idx" ON "CarSourceRecord"("sourceId", "externalId");

-- CreateIndex
CREATE INDEX "CarSourceRecord_reviewStatus_fetchedAt_idx" ON "CarSourceRecord"("reviewStatus", "fetchedAt");

-- CreateIndex
CREATE INDEX "CarSourceRecord_matchedCarId_fetchedAt_idx" ON "CarSourceRecord"("matchedCarId", "fetchedAt");

-- CreateIndex
CREATE INDEX "CarSourceRecord_runId_idx" ON "CarSourceRecord"("runId");

-- CreateIndex
CREATE INDEX "CarSourceRecord_contentHash_idx" ON "CarSourceRecord"("contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "CarSourceRecord_sourceId_sourceUrl_runId_key" ON "CarSourceRecord"("sourceId", "sourceUrl", "runId");
