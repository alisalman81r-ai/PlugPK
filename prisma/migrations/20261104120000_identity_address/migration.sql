-- The owner's own address, as printed on their CNIC (or the registered
-- address on a business licence), kept with the rest of their private
-- verification details. Where the chargers are installed stays on Business.
-- Additive only: one nullable column.
ALTER TABLE "ListingApplication" ADD COLUMN "idAddress" TEXT;
