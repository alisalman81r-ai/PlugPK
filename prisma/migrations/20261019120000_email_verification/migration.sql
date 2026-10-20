-- Email verification: an account cannot sign in until its owner confirms the
-- address. Additive: one nullable column and one new table.
--
-- IF NOT EXISTS because 20261016120000_email_verification already added the
-- column to the shared database (from an implementation reverted before it
-- was committed). On a fresh database that migration runs first and adds it.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(3);

-- Accounts made before verification existed were never asked to verify.
-- Treating them as unverified would lock every current member out on deploy,
-- so they keep access and count as verified from the day they joined. This
-- also covers accounts created after 20261016120000 ran, which it left null.
UPDATE "User" SET "emailVerifiedAt" = "createdAt" WHERE "emailVerifiedAt" IS NULL;

CREATE TABLE "EmailToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "redirectTo" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EmailToken_tokenHash_key" ON "EmailToken"("tokenHash");
CREATE INDEX "EmailToken_userId_purpose_idx" ON "EmailToken"("userId", "purpose");

ALTER TABLE "EmailToken" ADD CONSTRAINT "EmailToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
