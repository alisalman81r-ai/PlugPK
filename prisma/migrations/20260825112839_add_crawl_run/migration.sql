-- CreateTable
CREATE TABLE "CrawlRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'running',
    "recordsFound" INTEGER NOT NULL DEFAULT 0,
    "recordsStored" INTEGER NOT NULL DEFAULT 0,
    "recordsFailed" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "notes" TEXT
);

-- CreateIndex
CREATE INDEX "CrawlRun_sourceId_startedAt_idx" ON "CrawlRun"("sourceId", "startedAt");

-- CreateIndex
CREATE INDEX "CrawlRun_status_idx" ON "CrawlRun"("status");
