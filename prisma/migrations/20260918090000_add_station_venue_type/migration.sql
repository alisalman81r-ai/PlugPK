-- Where a charger physically sits: hotel, mall, office, home and so on.
--
-- Additive with a NOT NULL default, so every existing row is written as
-- 'other' in the same statement. Nothing is read, nothing is deleted, and no
-- station is filed under a venue nobody chose for it.
ALTER TABLE "Station" ADD COLUMN IF NOT EXISTS "venueType" TEXT NOT NULL DEFAULT 'other';
