-- AlterTable
ALTER TABLE "Business" ADD COLUMN "description" TEXT;

-- CreateTable
CREATE TABLE "BusinessDailyStat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "BusinessDailyStat_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stationId" TEXT,
    "businessId" TEXT,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userAvatar" TEXT,
    "userVehicle" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "photos" TEXT NOT NULL DEFAULT '[]',
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Review_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Review" ("comment", "date", "helpfulCount", "id", "isVerified", "photos", "rating", "stationId", "userAvatar", "userId", "userName", "userVehicle") SELECT "comment", "date", "helpfulCount", "id", "isVerified", "photos", "rating", "stationId", "userAvatar", "userId", "userName", "userVehicle" FROM "Review";
DROP TABLE "Review";
ALTER TABLE "new_Review" RENAME TO "Review";
CREATE INDEX "Review_stationId_idx" ON "Review"("stationId");
CREATE INDEX "Review_businessId_idx" ON "Review"("businessId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "BusinessDailyStat_businessId_idx" ON "BusinessDailyStat"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessDailyStat_businessId_day_key" ON "BusinessDailyStat"("businessId", "day");
