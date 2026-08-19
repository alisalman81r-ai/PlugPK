-- CreateTable
CREATE TABLE "SavedStation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedStation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SavedStation_userId_idx" ON "SavedStation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedStation_userId_listingId_key" ON "SavedStation"("userId", "listingId");
