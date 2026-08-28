-- Variant-level identity. Phase 4.1.
--
-- Additive only: nineteen ADD COLUMNs, every one nullable or defaulted, plus
-- three indexes. No DROP, no ALTER of an existing column, no data rewritten, no
-- history touched. SQLite runs each ADD COLUMN as a metadata-only change.
--
-- -- Why every new identity column is left NULL ------------------------
--
-- NULL on Car.variant means "this row does not declare a variant". That is a
-- true statement about all 36 rows today: variant currently lives inside
-- `model` as free text ("Atto 3 Advanced", "EV9 GT-Line"), and splitting it into
-- model + variant is a judgement about what is actually sold in this market.
--
-- A migration that guessed the split would be doing the very thing Phase 4.1
-- exists to stop: inventing variant identity. So it guesses nothing, and the
-- matcher reads NULL as "not proven" rather than "matches anything" — which
-- makes the safe behaviour the default from the moment this is applied, with no
-- follow-up step required to be safe.
--
-- scripts/report-variant-identity.ts proposes the splits for a person to confirm
-- in the car editor.

-- Car: the identity the catalogue asserts about itself.
ALTER TABLE "Car" ADD COLUMN "variant" TEXT;
ALTER TABLE "Car" ADD COLUMN "trim" TEXT;
ALTER TABLE "Car" ADD COLUMN "modelYear" INTEGER;
ALTER TABLE "Car" ADD COLUMN "generation" TEXT;
ALTER TABLE "Car" ADD COLUMN "rangeStandard" TEXT;
ALTER TABLE "Car" ADD COLUMN "electricRangeStandard" TEXT;

-- CarSourceRecord: the identity the source published, lifted out of the payload.
ALTER TABLE "CarSourceRecord" ADD COLUMN "variant" TEXT;
ALTER TABLE "CarSourceRecord" ADD COLUMN "trim" TEXT;
ALTER TABLE "CarSourceRecord" ADD COLUMN "modelYear" INTEGER;
ALTER TABLE "CarSourceRecord" ADD COLUMN "generation" TEXT;
ALTER TABLE "CarSourceRecord" ADD COLUMN "variantVerdict" TEXT;
ALTER TABLE "CarSourceRecord" ADD COLUMN "identityTier" TEXT;

-- CarFieldChange: the evidence beside the value, for the person deciding.
ALTER TABLE "CarFieldChange" ADD COLUMN "variantVerdict" TEXT;
ALTER TABLE "CarFieldChange" ADD COLUMN "identityTier" TEXT;
ALTER TABLE "CarFieldChange" ADD COLUMN "sourceVariant" TEXT;
ALTER TABLE "CarFieldChange" ADD COLUMN "sourceModelYear" INTEGER;
ALTER TABLE "CarFieldChange" ADD COLUMN "variantSensitive" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CarFieldChange" ADD COLUMN "currentRangeStandard" TEXT;
ALTER TABLE "CarFieldChange" ADD COLUMN "proposedRangeStandard" TEXT;

-- Variant questions are asked per model, so the index is on what identifies one.
CREATE INDEX "Car_brand_model_variant_idx" ON "Car"("brand", "model", "variant");
CREATE INDEX "CarSourceRecord_variantVerdict_idx" ON "CarSourceRecord"("variantVerdict");
CREATE INDEX "CarFieldChange_variantSensitive_status_idx" ON "CarFieldChange"("variantSensitive", "status");
