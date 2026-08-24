-- CreateTable
CREATE TABLE "Car" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priceMin" INTEGER NOT NULL,
    "priceMax" INTEGER NOT NULL,
    "priceDisplay" TEXT NOT NULL,
    "batteryCapacity" REAL,
    "range" INTEGER,
    "rangeMax" INTEGER,
    "electricRange" INTEGER,
    "electricRangeMax" INTEGER,
    "power" INTEGER,
    "acceleration" REAL,
    "topSpeed" INTEGER,
    "torque" INTEGER,
    "seats" INTEGER,
    "dcCharging" REAL,
    "acCharging" REAL,
    "connectors" TEXT NOT NULL DEFAULT '',
    "engineCapacity" INTEGER,
    "image" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Car_slug_key" ON "Car"("slug");

-- CreateIndex
CREATE INDEX "Car_category_idx" ON "Car"("category");

-- CreateIndex
CREATE INDEX "Car_brand_idx" ON "Car"("brand");
