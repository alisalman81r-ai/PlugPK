-- The full spec sheet on Car.
--
-- Car held fourteen of the roughly thirty-five facts a researched vehicle has.
-- The rest were going into `notes` as prose, which cannot be grouped, compared
-- or rendered as a table, so the detail page could not show a spec sheet even
-- when the data existed.
--
-- Additive only. Twenty nullable columns, no DROP, no ALTER of an existing
-- column, no backfill. Every existing row keeps exactly the values it has and
-- reads null for all twenty, which is the truthful state: nobody has researched
-- those cars yet.
--
-- Spans are stored as two columns rather than averaged, matching range/rangeMax
-- and priceMin/priceMax: a source quoting 145-170 mm has not published 157.5.
ALTER TABLE "Car" ADD COLUMN "bodyType" TEXT;
ALTER TABLE "Car" ADD COLUMN "driveType" TEXT;
ALTER TABLE "Car" ADD COLUMN "motorPowerKw" INTEGER;
ALTER TABLE "Car" ADD COLUMN "realWorldRange" INTEGER;
ALTER TABLE "Car" ADD COLUMN "realWorldRangeMax" INTEGER;
ALTER TABLE "Car" ADD COLUMN "consumption" REAL;
ALTER TABLE "Car" ADD COLUMN "consumptionMax" REAL;
ALTER TABLE "Car" ADD COLUMN "acChargingHours" REAL;
ALTER TABLE "Car" ADD COLUMN "dcChargingMinutes" INTEGER;
ALTER TABLE "Car" ADD COLUMN "batteryTech" TEXT;
ALTER TABLE "Car" ADD COLUMN "lengthMm" INTEGER;
ALTER TABLE "Car" ADD COLUMN "widthMm" INTEGER;
ALTER TABLE "Car" ADD COLUMN "heightMm" INTEGER;
ALTER TABLE "Car" ADD COLUMN "wheelbaseMm" INTEGER;
ALTER TABLE "Car" ADD COLUMN "groundClearanceMm" INTEGER;
ALTER TABLE "Car" ADD COLUMN "groundClearanceMaxMm" INTEGER;
ALTER TABLE "Car" ADD COLUMN "bootCapacityL" INTEGER;
ALTER TABLE "Car" ADD COLUMN "kerbWeightKg" INTEGER;
ALTER TABLE "Car" ADD COLUMN "availability" TEXT;
ALTER TABLE "Car" ADD COLUMN "distributor" TEXT;
ALTER TABLE "Car" ADD COLUMN "warranty" TEXT;
