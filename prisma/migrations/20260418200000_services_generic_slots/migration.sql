-- Make slots generic (not tied to a specific service) and store serviceId as plain text

-- 1. Drop old index that references serviceId on Slot
DROP INDEX IF EXISTS "Slot_serviceId_status_startsAt_idx";

-- 2. Drop serviceId column on Slot (slots are generic)
ALTER TABLE "Slot" DROP COLUMN IF EXISTS "serviceId";

-- 3. Convert Booking.serviceId from enum to TEXT
ALTER TABLE "Booking"
  ALTER COLUMN "serviceId" TYPE TEXT USING "serviceId"::text;

-- 4. Drop the now-unused enum type
DROP TYPE IF EXISTS "ServiceType";

-- 5. Create new index on Slot for faster availability queries
CREATE INDEX IF NOT EXISTS "Slot_status_startsAt_idx" ON "Slot"("status", "startsAt");
