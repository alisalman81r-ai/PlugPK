-- Supabase Auth holds passwords and confirms email addresses. Each account is
-- linked to its Supabase user, and no account can sign in until its address
-- is confirmed — including every account that exists today.

-- Legacy scrypt hash: kept only until the account's first sign-in moves the
-- password to Supabase. New accounts never have one.
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

ALTER TABLE "User" ADD COLUMN "authUserId" TEXT;
CREATE UNIQUE INDEX "User_authUserId_key" ON "User"("authUserId");

-- Null for everyone, deliberately: existing members confirm their address on
-- their next sign-in, like new ones. Their open sessions end on deploy.
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

ALTER TABLE "User" ADD COLUMN "pendingRedirect" TEXT;
