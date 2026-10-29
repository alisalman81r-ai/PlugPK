-- Member activity from the website joins the app's in AppEvent, told apart by
-- "source". Every existing row came from the app.
ALTER TABLE "AppEvent" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'app';
CREATE INDEX "AppEvent_source_createdAt_idx" ON "AppEvent"("source", "createdAt");

-- Who actually sent a meeting request or a service application, when they were
-- signed in. Older rows stay unlinked: a typed email is not proof of an account.
ALTER TABLE "MeetingRequest" ADD COLUMN "userId" TEXT;
CREATE INDEX "MeetingRequest_userId_idx" ON "MeetingRequest"("userId");
ALTER TABLE "MeetingRequest" ADD CONSTRAINT "MeetingRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EVService" ADD COLUMN "userId" TEXT;
CREATE INDEX "EVService_userId_idx" ON "EVService"("userId");
ALTER TABLE "EVService" ADD CONSTRAINT "EVService_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
