ALTER TABLE "CommunityPost" ADD COLUMN "adminViewedAt" TIMESTAMP(3);

UPDATE "CommunityPost" SET "adminViewedAt" = CURRENT_TIMESTAMP WHERE "adminViewedAt" IS NULL;