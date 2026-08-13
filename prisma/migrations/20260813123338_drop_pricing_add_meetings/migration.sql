-- CreateTable
CREATE TABLE "MeetingRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "preferredDate" TEXT,
    "preferredTime" TEXT,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Connector" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "maxPowerKw" REAL NOT NULL,
    "ports" INTEGER NOT NULL,
    "availablePorts" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "compatibleVehicles" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "Connector_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Connector" ("availablePorts", "compatibleVehicles", "id", "maxPowerKw", "ports", "stationId", "status", "type") SELECT "availablePorts", "compatibleVehicles", "id", "maxPowerKw", "ports", "stationId", "status", "type" FROM "Connector";
DROP TABLE "Connector";
ALTER TABLE "new_Connector" RENAME TO "Connector";
CREATE INDEX "Connector_stationId_idx" ON "Connector"("stationId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "MeetingRequest_status_idx" ON "MeetingRequest"("status");

-- CreateIndex
CREATE INDEX "MeetingRequest_createdAt_idx" ON "MeetingRequest"("createdAt");

