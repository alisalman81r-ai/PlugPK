-- Mobile app data in the admin portal: where an account came from, when it
-- last used the app, every action the app sends, and the app's release log.
-- Additive only: two nullable/defaulted columns and two new tables.

ALTER TABLE "User" ADD COLUMN "signupSource" TEXT NOT NULL DEFAULT 'web';
ALTER TABLE "User" ADD COLUMN "lastAppActiveAt" TIMESTAMP(3);
CREATE INDEX "User_lastAppActiveAt_idx" ON "User"("lastAppActiveAt");

CREATE TABLE "AppEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "type" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AppEvent_createdAt_idx" ON "AppEvent"("createdAt");
CREATE INDEX "AppEvent_userId_idx" ON "AppEvent"("userId");
CREATE INDEX "AppEvent_type_idx" ON "AppEvent"("type");

CREATE TABLE "AppRelease" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppRelease_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AppRelease_sentAt_idx" ON "AppRelease"("sentAt");
