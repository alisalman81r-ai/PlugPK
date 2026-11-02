-- Paid listing: an owner proves who they are (CNIC for a home charger, a
-- licence or registration for a business), pays the listing fee, and an
-- operator confirms the payment before the listing can be approved.
-- Additive only: three new tables, nothing on Business changes, so the
-- deployment still serving while this one builds is unaffected.

CREATE TABLE "ListingApplication" (
    "businessId" TEXT NOT NULL,
    "idType" TEXT,
    "idNumber" TEXT,
    "idDetail" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingApplication_pkey" PRIMARY KEY ("businessId")
);
ALTER TABLE "ListingApplication" ADD CONSTRAINT "ListingApplication_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "BusinessDocument" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "bytes" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessDocument_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BusinessDocument_businessId_kind_key" ON "BusinessDocument"("businessId", "kind");
ALTER TABLE "BusinessDocument" ADD CONSTRAINT "BusinessDocument_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ListingPayment" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "method" TEXT NOT NULL,
    "payerName" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "paidOn" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingPayment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ListingPayment_businessId_createdAt_idx" ON "ListingPayment"("businessId", "createdAt");
CREATE INDEX "ListingPayment_status_idx" ON "ListingPayment"("status");
ALTER TABLE "ListingPayment" ADD CONSTRAINT "ListingPayment_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
