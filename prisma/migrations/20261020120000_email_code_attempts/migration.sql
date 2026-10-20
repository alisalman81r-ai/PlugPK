-- Six-digit verification codes: count wrong guesses so a code dies after a
-- few attempts. Additive only — one defaulted column, no rows changed.
ALTER TABLE "EmailToken" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;
