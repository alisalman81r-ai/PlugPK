-- Approval gate for EV services.
--
-- Services were admin-created only: every row was live the moment it existed,
-- and a workshop or installer had no way to ask to be listed. This adds the
-- same gate charger hosts already pass through on Business.status.
--
-- Additive only. Three nullable-or-defaulted columns and one index. No DROP,
-- no ALTER of an existing column, nothing rewritten.
ALTER TABLE "EVService" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "EVService" ADD COLUMN "submittedAt" DATETIME;
ALTER TABLE "EVService" ADD COLUMN "reviewNote" TEXT;

-- Every row that predates this migration was already published on the live
-- site, so it is approved by definition. Without this the column default of
-- 'pending' would take all twelve services off the public Services page the
-- moment the query starts filtering — the migration would look successful and
-- the site would silently empty.
UPDATE "EVService" SET "status" = 'approved';

CREATE INDEX "EVService_status_idx" ON "EVService"("status");
