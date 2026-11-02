-- A booking is now as long as the driver's charge needs, not a fixed slot.
-- Record the plan it was timed for, so the host sees what the driver expects.
-- Additive only: four nullable columns.
ALTER TABLE "ChargerBooking" ADD COLUMN "fromPct" INTEGER;
ALTER TABLE "ChargerBooking" ADD COLUMN "toPct" INTEGER;
ALTER TABLE "ChargerBooking" ADD COLUMN "energyKwh" DOUBLE PRECISION;
ALTER TABLE "ChargerBooking" ADD COLUMN "durationMinutes" INTEGER;
