-- Conditional-request state, per source.
--
-- Four ADD COLUMNs, all nullable or defaulted, so this cannot fail on an
-- existing row and cannot lose one. The standing constraint on this project is
-- that crawler migrations stay additive: a CREATE TABLE or an ADD COLUMN cannot
-- damage a live catalogue, and a DROP or a type change can.
--
-- SQLite runs each of these as a metadata-only change — no table rewrite, no
-- risk to the 15 committed migrations before it.

ALTER TABLE "CarSource" ADD COLUMN "lastEtag" TEXT;
ALTER TABLE "CarSource" ADD COLUMN "lastModifiedHttp" TEXT;
ALTER TABLE "CarSource" ADD COLUMN "lastSeenModified" DATETIME;
ALTER TABLE "CarSource" ADD COLUMN "recordBudget" INTEGER NOT NULL DEFAULT 0;
