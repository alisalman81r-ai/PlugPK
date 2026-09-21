-- A paid, one-time membership of a club (and later, a community).
--
-- Purely additive. One new table and its indexes: no existing table is
-- altered, no column is dropped, no row is written or read. ClubMember is
-- deliberately left exactly as it is — it holds no rows, and a later phase can
-- drop it once nothing reads it.
--
-- The foreign key is on userId only. scopeId is not a foreign key because the
-- same row shape has to cover a club today and a community later, and a second
-- nullable reference per type is how one membership table becomes six. The
-- database therefore cannot enforce that scopeId points at something real; the
-- query helpers are the only thing that reads it, so the check lives there.
--
-- ON DELETE CASCADE on the user matches every other table hanging off User
-- (SavedStation, UserVehicle, ClubMember). Deleting an account takes its
-- memberships with it rather than leaving rows pointing at nobody.
CREATE TABLE IF NOT EXISTS "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- Stripe retries webhooks. Replaying a delivery must not be able to grant a
-- second membership, so the session that paid for one is unique across the
-- table. Nullable, so a membership granted by other means needs no fake id —
-- Postgres treats NULLs as distinct in a unique index, which is what allows
-- more than one of those to exist.
CREATE UNIQUE INDEX IF NOT EXISTS "Membership_stripeCheckoutSessionId_key"
    ON "Membership"("stripeCheckoutSessionId");

-- The last line of defence against a double purchase. The UI hides the button
-- and the server refuses to open a second checkout; this is what catches two
-- tabs racing each other, turning a second charge into a failed insert.
CREATE UNIQUE INDEX IF NOT EXISTS "Membership_userId_scope_scopeId_key"
    ON "Membership"("userId", "scope", "scopeId");

-- "what does this user belong to?" — the profile and the join button.
CREATE INDEX IF NOT EXISTS "Membership_userId_idx" ON "Membership"("userId");

-- "who belongs to this club?" — the member count on every club card.
CREATE INDEX IF NOT EXISTS "Membership_scope_scopeId_idx" ON "Membership"("scope", "scopeId");

ALTER TABLE "Membership"
    ADD CONSTRAINT "Membership_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
