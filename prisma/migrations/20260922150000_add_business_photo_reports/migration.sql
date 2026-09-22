CREATE TABLE "BusinessPhotoReport" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "businessId" TEXT NOT NULL,
  "photoUrl" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'new',
  "reporterId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BusinessPhotoReport_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "BusinessPhotoReport_businessId_status_idx" ON "BusinessPhotoReport"("businessId", "status");
CREATE INDEX "BusinessPhotoReport_status_idx" ON "BusinessPhotoReport"("status");