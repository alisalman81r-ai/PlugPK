-- CreateTable
CREATE TABLE "CarFieldChange" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "carId" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "currentValue" TEXT,
    "proposedValue" TEXT,
    "rawValue" TEXT,
    "unit" TEXT,
    "changeType" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL DEFAULT 'review',
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "confidenceReasons" TEXT,
    "opinions" TEXT,
    "validationFlags" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedAt" DATETIME,
    "reviewedBy" TEXT,
    "reviewNote" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "fetchedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CarFieldChange_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CarChangeHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "carId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "sourceId" TEXT,
    "sourceUrl" TEXT,
    "changeId" TEXT,
    "approvedBy" TEXT NOT NULL,
    "approvedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    CONSTRAINT "CarChangeHistory_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CarPriceHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "carId" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "market" TEXT NOT NULL DEFAULT 'PK',
    "priceType" TEXT NOT NULL DEFAULT 'indicative',
    "sourceId" TEXT,
    "sourceUrl" TEXT,
    "fetchedAt" DATETIME NOT NULL,
    "effectiveDate" DATETIME,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CarPriceHistory_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CarImageCandidate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "carId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceId" TEXT,
    "licence" TEXT,
    "licenceUrl" TEXT,
    "attribution" TEXT,
    "fetchedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedAt" DATETIME,
    "reviewNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CarImageCandidate_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CarFieldChange_status_confidence_idx" ON "CarFieldChange"("status", "confidence");

-- CreateIndex
CREATE INDEX "CarFieldChange_carId_field_idx" ON "CarFieldChange"("carId", "field");

-- CreateIndex
CREATE INDEX "CarFieldChange_riskLevel_status_idx" ON "CarFieldChange"("riskLevel", "status");

-- CreateIndex
CREATE INDEX "CarFieldChange_changeType_idx" ON "CarFieldChange"("changeType");

-- CreateIndex
CREATE UNIQUE INDEX "CarFieldChange_carId_field_sourceId_runId_key" ON "CarFieldChange"("carId", "field", "sourceId", "runId");

-- CreateIndex
CREATE INDEX "CarChangeHistory_carId_approvedAt_idx" ON "CarChangeHistory"("carId", "approvedAt");

-- CreateIndex
CREATE INDEX "CarChangeHistory_field_idx" ON "CarChangeHistory"("field");

-- CreateIndex
CREATE INDEX "CarPriceHistory_carId_fetchedAt_idx" ON "CarPriceHistory"("carId", "fetchedAt");

-- CreateIndex
CREATE INDEX "CarPriceHistory_carId_market_fetchedAt_idx" ON "CarPriceHistory"("carId", "market", "fetchedAt");

-- CreateIndex
CREATE INDEX "CarImageCandidate_status_idx" ON "CarImageCandidate"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CarImageCandidate_carId_imageUrl_key" ON "CarImageCandidate"("carId", "imageUrl");
