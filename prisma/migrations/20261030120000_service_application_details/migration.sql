-- The fuller service application: who to talk to, WhatsApp, a social page,
-- how long they have traded, the EV makes they work with and typical prices.
-- All optional, so existing listings and the app's shorter form are unaffected.
ALTER TABLE "EVService" ADD COLUMN "contactName" TEXT;
ALTER TABLE "EVService" ADD COLUMN "contactRole" TEXT;
ALTER TABLE "EVService" ADD COLUMN "whatsapp" TEXT;
ALTER TABLE "EVService" ADD COLUMN "socialUrl" TEXT;
ALTER TABLE "EVService" ADD COLUMN "yearEstablished" INTEGER;
ALTER TABLE "EVService" ADD COLUMN "brands" TEXT;
ALTER TABLE "EVService" ADD COLUMN "pricing" TEXT;
