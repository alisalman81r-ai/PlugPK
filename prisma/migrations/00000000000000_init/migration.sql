-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Station" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "street" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "postalCode" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "amenities" TEXT NOT NULL DEFAULT '[]',
    "operatingHours" TEXT NOT NULL DEFAULT '{}',
    "photos" TEXT NOT NULL DEFAULT '[]',
    "coverPhoto" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'unknown',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "network" TEXT NOT NULL DEFAULT '',
    "phone" TEXT,
    "website" TEXT,
    "businessId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Station_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Connector" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "maxPowerKw" DOUBLE PRECISION NOT NULL,
    "ports" INTEGER NOT NULL,
    "availablePorts" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "compatibleVehicles" TEXT NOT NULL DEFAULT '[]',

    CONSTRAINT "Connector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "stationId" TEXT,
    "businessId" TEXT,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userAvatar" TEXT,
    "userVehicle" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "photos" TEXT NOT NULL DEFAULT '[]',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessDailyStat" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BusinessDailyStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EVService" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "postalCode" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "website" TEXT,
    "photos" TEXT NOT NULL DEFAULT '[]',
    "coverPhoto" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "operatingHours" TEXT NOT NULL DEFAULT '{}',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submittedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EVService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userAvatar" TEXT,
    "userVehicle" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "photos" TEXT NOT NULL DEFAULT '[]',
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userAvatar" TEXT,
    "content" TEXT NOT NULL,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "vehicle" TEXT,
    "avatar" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedStation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedStation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "preferredDate" TEXT,
    "preferredTime" TEXT,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "ownerName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "businessName" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT,
    "website" TEXT,
    "description" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "chargers" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "powertrain" TEXT NOT NULL,
    "availability" TEXT NOT NULL,
    "bodyType" TEXT NOT NULL,
    "modelYear" INTEGER,
    "rangeKm" INTEGER,
    "batteryCapacityKwh" DOUBLE PRECISION,
    "connectors" TEXT,
    "dcChargingKw" INTEGER,
    "acChargingKw" INTEGER,
    "pricePkr" INTEGER,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserVehicle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "customName" TEXT,
    "color" TEXT,
    "licensePlate" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Club" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "coverPhoto" TEXT,
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubMember" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Car" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "variant" TEXT,
    "trim" TEXT,
    "modelYear" INTEGER,
    "generation" TEXT,
    "rangeStandard" TEXT,
    "electricRangeStandard" TEXT,
    "priceMin" INTEGER NOT NULL,
    "priceMax" INTEGER NOT NULL,
    "priceDisplay" TEXT NOT NULL,
    "batteryCapacity" DOUBLE PRECISION,
    "range" INTEGER,
    "rangeMax" INTEGER,
    "electricRange" INTEGER,
    "electricRangeMax" INTEGER,
    "power" INTEGER,
    "acceleration" DOUBLE PRECISION,
    "topSpeed" INTEGER,
    "torque" INTEGER,
    "seats" INTEGER,
    "dcCharging" DOUBLE PRECISION,
    "acCharging" DOUBLE PRECISION,
    "connectors" TEXT NOT NULL DEFAULT '',
    "engineCapacity" INTEGER,
    "bodyType" TEXT,
    "driveType" TEXT,
    "motorPowerKw" INTEGER,
    "realWorldRange" INTEGER,
    "realWorldRangeMax" INTEGER,
    "consumption" DOUBLE PRECISION,
    "consumptionMax" DOUBLE PRECISION,
    "acChargingHours" DOUBLE PRECISION,
    "dcChargingMinutes" INTEGER,
    "batteryTech" TEXT,
    "lengthMm" INTEGER,
    "widthMm" INTEGER,
    "heightMm" INTEGER,
    "wheelbaseMm" INTEGER,
    "groundClearanceMm" INTEGER,
    "groundClearanceMaxMm" INTEGER,
    "bootCapacityL" INTEGER,
    "kerbWeightKg" INTEGER,
    "availability" TEXT,
    "distributor" TEXT,
    "warranty" TEXT,
    "image" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Car_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "robotsStatus" TEXT NOT NULL DEFAULT 'unchecked',
    "robotsCheckedAt" TIMESTAMP(3),
    "robotsNote" TEXT,
    "trustRank" INTEGER NOT NULL DEFAULT 50,
    "crawlIntervalMinutes" INTEGER NOT NULL DEFAULT 1440,
    "requestDelayMs" INTEGER NOT NULL DEFAULT 1500,
    "lastCrawledAt" TIMESTAMP(3),
    "schedule" TEXT NOT NULL DEFAULT 'daily',
    "lastSuccessAt" TIMESTAMP(3),
    "lastFailureAt" TIMESTAMP(3),
    "lastError" TEXT,
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "avgResponseMs" INTEGER,
    "lastChangedAt" TIMESTAMP(3),
    "staleAfterDays" INTEGER NOT NULL DEFAULT 7,
    "lastEtag" TEXT,
    "lastModifiedHttp" TEXT,
    "lastSeenModified" TIMESTAMP(3),
    "recordBudget" INTEGER NOT NULL DEFAULT 0,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarSourceRecord" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "externalId" TEXT,
    "variant" TEXT,
    "trim" TEXT,
    "modelYear" INTEGER,
    "generation" TEXT,
    "variantVerdict" TEXT,
    "identityTier" TEXT,
    "runId" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "httpStatus" INTEGER,
    "raw" TEXT NOT NULL,
    "normalised" TEXT,
    "contentHash" TEXT NOT NULL,
    "extractionStatus" TEXT NOT NULL DEFAULT 'ok',
    "fieldsFound" INTEGER NOT NULL DEFAULT 0,
    "fieldsExpected" INTEGER NOT NULL DEFAULT 0,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "reviewStatus" TEXT NOT NULL DEFAULT 'pending',
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "matchedCarId" TEXT,
    "matchStrategy" TEXT,
    "matchScore" INTEGER,
    "matchCandidates" TEXT,
    "errorMessage" TEXT,
    "errorFields" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarSourceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrawlRun" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'running',
    "recordsFound" INTEGER NOT NULL DEFAULT 0,
    "recordsStored" INTEGER NOT NULL DEFAULT 0,
    "recordsFailed" INTEGER NOT NULL DEFAULT 0,
    "recordsChanged" INTEGER NOT NULL DEFAULT 0,
    "recordsUnchanged" INTEGER NOT NULL DEFAULT 0,
    "recordsPendingReview" INTEGER NOT NULL DEFAULT 0,
    "candidatesFound" INTEGER NOT NULL DEFAULT 0,
    "trigger" TEXT NOT NULL DEFAULT 'manual',
    "durationMs" INTEGER,
    "errors" TEXT,
    "notes" TEXT,

    CONSTRAINT "CrawlRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarFieldChange" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "currentValue" TEXT,
    "proposedValue" TEXT,
    "rawValue" TEXT,
    "unit" TEXT,
    "changeType" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL DEFAULT 'review',
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "confidenceReasons" TEXT,
    "opinions" TEXT,
    "validationFlags" TEXT,
    "variantVerdict" TEXT,
    "identityTier" TEXT,
    "sourceVariant" TEXT,
    "sourceModelYear" INTEGER,
    "variantSensitive" BOOLEAN NOT NULL DEFAULT false,
    "currentRangeStandard" TEXT,
    "proposedRangeStandard" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewNote" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarFieldChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarChangeHistory" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "sourceId" TEXT,
    "sourceUrl" TEXT,
    "changeId" TEXT,
    "approvedBy" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    CONSTRAINT "CarChangeHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarPriceHistory" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "market" TEXT NOT NULL DEFAULT 'PK',
    "priceType" TEXT NOT NULL DEFAULT 'indicative',
    "sourceId" TEXT,
    "sourceUrl" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "effectiveDate" TIMESTAMP(3),
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarPriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarImageCandidate" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceId" TEXT,
    "licence" TEXT,
    "licenceUrl" TEXT,
    "attribution" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarImageCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarCandidate" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "variant" TEXT,
    "trim" TEXT,
    "modelYear" INTEGER,
    "category" TEXT,
    "normalised" TEXT NOT NULL,
    "possibleDuplicateOf" TEXT,
    "duplicateReason" TEXT,
    "matchScore" INTEGER,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "mergedInto" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrawlLogEntry" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "carId" TEXT,
    "operation" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrawlLogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Station_slug_key" ON "Station"("slug");

-- CreateIndex
CREATE INDEX "Station_city_idx" ON "Station"("city");

-- CreateIndex
CREATE INDEX "Station_status_idx" ON "Station"("status");

-- CreateIndex
CREATE INDEX "Connector_stationId_idx" ON "Connector"("stationId");

-- CreateIndex
CREATE INDEX "Review_stationId_idx" ON "Review"("stationId");

-- CreateIndex
CREATE INDEX "Review_businessId_idx" ON "Review"("businessId");

-- CreateIndex
CREATE INDEX "BusinessDailyStat_businessId_idx" ON "BusinessDailyStat"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessDailyStat_businessId_day_key" ON "BusinessDailyStat"("businessId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "EVService_slug_key" ON "EVService"("slug");

-- CreateIndex
CREATE INDEX "EVService_category_idx" ON "EVService"("category");

-- CreateIndex
CREATE INDEX "EVService_city_idx" ON "EVService"("city");

-- CreateIndex
CREATE INDEX "EVService_status_idx" ON "EVService"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityPost_slug_key" ON "CommunityPost"("slug");

-- CreateIndex
CREATE INDEX "CommunityPost_category_idx" ON "CommunityPost"("category");

-- CreateIndex
CREATE INDEX "Comment_postId_idx" ON "Comment"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "SavedStation_userId_idx" ON "SavedStation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedStation_userId_listingId_key" ON "SavedStation"("userId", "listingId");

-- CreateIndex
CREATE INDEX "MeetingRequest_status_idx" ON "MeetingRequest"("status");

-- CreateIndex
CREATE INDEX "MeetingRequest_createdAt_idx" ON "MeetingRequest"("createdAt");

-- CreateIndex
CREATE INDEX "Business_status_idx" ON "Business"("status");

-- CreateIndex
CREATE INDEX "Business_createdAt_idx" ON "Business"("createdAt");

-- CreateIndex
CREATE INDEX "Vehicle_brand_idx" ON "Vehicle"("brand");

-- CreateIndex
CREATE INDEX "Vehicle_powertrain_idx" ON "Vehicle"("powertrain");

-- CreateIndex
CREATE INDEX "Vehicle_availability_idx" ON "Vehicle"("availability");

-- CreateIndex
CREATE INDEX "UserVehicle_userId_idx" ON "UserVehicle"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserVehicle_userId_vehicleId_key" ON "UserVehicle"("userId", "vehicleId");

-- CreateIndex
CREATE INDEX "Club_city_idx" ON "Club"("city");

-- CreateIndex
CREATE INDEX "ClubMember_userId_idx" ON "ClubMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClubMember_clubId_userId_key" ON "ClubMember"("clubId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Car_slug_key" ON "Car"("slug");

-- CreateIndex
CREATE INDEX "Car_category_idx" ON "Car"("category");

-- CreateIndex
CREATE INDEX "Car_brand_idx" ON "Car"("brand");

-- CreateIndex
CREATE UNIQUE INDEX "CarSource_name_key" ON "CarSource"("name");

-- CreateIndex
CREATE INDEX "CarSource_isEnabled_idx" ON "CarSource"("isEnabled");

-- CreateIndex
CREATE INDEX "CarSourceRecord_sourceId_externalId_idx" ON "CarSourceRecord"("sourceId", "externalId");

-- CreateIndex
CREATE INDEX "CarSourceRecord_reviewStatus_fetchedAt_idx" ON "CarSourceRecord"("reviewStatus", "fetchedAt");

-- CreateIndex
CREATE INDEX "CarSourceRecord_matchedCarId_fetchedAt_idx" ON "CarSourceRecord"("matchedCarId", "fetchedAt");

-- CreateIndex
CREATE INDEX "CarSourceRecord_runId_idx" ON "CarSourceRecord"("runId");

-- CreateIndex
CREATE INDEX "CarSourceRecord_contentHash_idx" ON "CarSourceRecord"("contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "CarSourceRecord_sourceId_sourceUrl_runId_key" ON "CarSourceRecord"("sourceId", "sourceUrl", "runId");

-- CreateIndex
CREATE INDEX "CrawlRun_sourceId_startedAt_idx" ON "CrawlRun"("sourceId", "startedAt");

-- CreateIndex
CREATE INDEX "CrawlRun_status_idx" ON "CrawlRun"("status");

-- CreateIndex
CREATE INDEX "CarFieldChange_status_confidence_idx" ON "CarFieldChange"("status", "confidence");

-- CreateIndex
CREATE INDEX "CarFieldChange_carId_field_idx" ON "CarFieldChange"("carId", "field");

-- CreateIndex
CREATE INDEX "CarFieldChange_riskLevel_status_idx" ON "CarFieldChange"("riskLevel", "status");

-- CreateIndex
CREATE INDEX "CarFieldChange_changeType_idx" ON "CarFieldChange"("changeType");

-- CreateIndex
CREATE UNIQUE INDEX "CarFieldChange_carId_field_sourceId_runId_key" ON "CarFieldChange"("carId", "field", "sourceId", "runId");

-- CreateIndex
CREATE INDEX "CarChangeHistory_carId_approvedAt_idx" ON "CarChangeHistory"("carId", "approvedAt");

-- CreateIndex
CREATE INDEX "CarChangeHistory_field_idx" ON "CarChangeHistory"("field");

-- CreateIndex
CREATE INDEX "CarPriceHistory_carId_fetchedAt_idx" ON "CarPriceHistory"("carId", "fetchedAt");

-- CreateIndex
CREATE INDEX "CarPriceHistory_carId_market_fetchedAt_idx" ON "CarPriceHistory"("carId", "market", "fetchedAt");

-- CreateIndex
CREATE INDEX "CarImageCandidate_status_idx" ON "CarImageCandidate"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CarImageCandidate_carId_imageUrl_key" ON "CarImageCandidate"("carId", "imageUrl");

-- CreateIndex
CREATE INDEX "CarCandidate_status_confidence_idx" ON "CarCandidate"("status", "confidence");

-- CreateIndex
CREATE INDEX "CarCandidate_possibleDuplicateOf_idx" ON "CarCandidate"("possibleDuplicateOf");

-- CreateIndex
CREATE UNIQUE INDEX "CarCandidate_sourceId_brand_model_variant_modelYear_key" ON "CarCandidate"("sourceId", "brand", "model", "variant", "modelYear");

-- CreateIndex
CREATE INDEX "CrawlLogEntry_runId_createdAt_idx" ON "CrawlLogEntry"("runId", "createdAt");

-- CreateIndex
CREATE INDEX "CrawlLogEntry_sourceId_status_createdAt_idx" ON "CrawlLogEntry"("sourceId", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "Connector" ADD CONSTRAINT "Connector_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessDailyStat" ADD CONSTRAINT "BusinessDailyStat_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedStation" ADD CONSTRAINT "SavedStation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVehicle" ADD CONSTRAINT "UserVehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVehicle" ADD CONSTRAINT "UserVehicle_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMember" ADD CONSTRAINT "ClubMember_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMember" ADD CONSTRAINT "ClubMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarSourceRecord" ADD CONSTRAINT "CarSourceRecord_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "CarSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarSourceRecord" ADD CONSTRAINT "CarSourceRecord_matchedCarId_fkey" FOREIGN KEY ("matchedCarId") REFERENCES "Car"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarFieldChange" ADD CONSTRAINT "CarFieldChange_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarChangeHistory" ADD CONSTRAINT "CarChangeHistory_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarPriceHistory" ADD CONSTRAINT "CarPriceHistory_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarImageCandidate" ADD CONSTRAINT "CarImageCandidate_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;

