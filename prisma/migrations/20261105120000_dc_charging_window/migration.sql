-- The state of charge a quoted DC charge time starts from: 10, 20 or 30, always
-- to 80%. Makers quote different windows (Deepal and Chery 30-80%, iCaur
-- 20-80%, most others 10-80%), and a 30-80% time shown as 10-80% reads as a
-- car that charges faster than it does. Null means 10, which every time stored
-- before this column existed was.
-- Additive only: one nullable column.
ALTER TABLE "Car" ADD COLUMN "dcChargingFromPct" INTEGER;
