-- Hosts run their own listing: a price per kWh, payout accounts for booking
-- advances, bookable slots. Additive only: three new tables. Charger status
-- lives inside the existing Business.chargers JSON, so no column changes.

CREATE TABLE "HostSettings" (
    "businessId" TEXT NOT NULL,
    "pricePerKwh" INTEGER,
    "bookingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "bookingFee" INTEGER NOT NULL DEFAULT 0,
    "slotMinutes" INTEGER NOT NULL DEFAULT 60,
    "openTime" TEXT NOT NULL DEFAULT '09:00',
    "closeTime" TEXT NOT NULL DEFAULT '21:00',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostSettings_pkey" PRIMARY KEY ("businessId")
);
ALTER TABLE "HostSettings" ADD CONSTRAINT "HostSettings_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "PayoutAccount" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "provider" TEXT,
    "accountTitle" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "iban" TEXT,
    "qrMime" TEXT,
    "qrBytes" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayoutAccount_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PayoutAccount_businessId_idx" ON "PayoutAccount"("businessId");
ALTER TABLE "PayoutAccount" ADD CONSTRAINT "PayoutAccount_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ChargerBooking" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "chargerId" TEXT NOT NULL,
    "chargerLabel" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "fee" INTEGER NOT NULL,
    "pricePerKwh" INTEGER,
    "payMethod" TEXT NOT NULL,
    "payerName" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "receiptMime" TEXT NOT NULL,
    "receiptBytes" BYTEA NOT NULL,
    "vehicle" TEXT,
    "hostNote" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChargerBooking_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ChargerBooking_businessId_date_idx" ON "ChargerBooking"("businessId", "date");
CREATE INDEX "ChargerBooking_chargerId_date_startTime_idx" ON "ChargerBooking"("chargerId", "date", "startTime");
CREATE INDEX "ChargerBooking_userId_createdAt_idx" ON "ChargerBooking"("userId", "createdAt");
ALTER TABLE "ChargerBooking" ADD CONSTRAINT "ChargerBooking_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChargerBooking" ADD CONSTRAINT "ChargerBooking_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
