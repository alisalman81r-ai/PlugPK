-- A route a driver planned and kept, for the dashboard's Saved Routes.
--
-- Purely additive: one new table, its index and its foreign key. No existing
-- table is altered and no row is read or written. ON DELETE CASCADE on the
-- user matches the other tables hanging off User (SavedStation, UserVehicle,
-- Membership): deleting an account takes its saved routes with it.
CREATE TABLE IF NOT EXISTS "SavedRoute" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "carId" TEXT,
    "carName" TEXT NOT NULL,
    "batteryPercent" INTEGER NOT NULL,
    "distanceKm" INTEGER NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "stops" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedRoute_pkey" PRIMARY KEY ("id")
);

-- The dashboard lists one driver's routes, newest first.
CREATE INDEX IF NOT EXISTS "SavedRoute_userId_createdAt_idx" ON "SavedRoute"("userId", "createdAt");

ALTER TABLE "SavedRoute"
    ADD CONSTRAINT "SavedRoute_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
