-- Operator stations take bookings too, hosted by the Plug.pk team.
-- A booking now belongs to a partner listing or a station, so businessId
-- becomes optional and stationId is added. Station booking rules get their
-- own table. No existing row changes: every booking so far has a businessId.

ALTER TABLE "ChargerBooking" ALTER COLUMN "businessId" DROP NOT NULL;
ALTER TABLE "ChargerBooking" ADD COLUMN "stationId" TEXT;
CREATE INDEX "ChargerBooking_stationId_date_idx" ON "ChargerBooking"("stationId", "date");
ALTER TABLE "ChargerBooking" ADD CONSTRAINT "ChargerBooking_stationId_fkey"
    FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "StationBookingSettings" (
    "stationId" TEXT NOT NULL,
    "pricePerKwh" INTEGER,
    "bookingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "bookingFee" INTEGER NOT NULL DEFAULT 0,
    "slotMinutes" INTEGER NOT NULL DEFAULT 30,
    "openTime" TEXT NOT NULL DEFAULT '09:00',
    "closeTime" TEXT NOT NULL DEFAULT '21:00',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StationBookingSettings_pkey" PRIMARY KEY ("stationId")
);
ALTER TABLE "StationBookingSettings" ADD CONSTRAINT "StationBookingSettings_stationId_fkey"
    FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;
