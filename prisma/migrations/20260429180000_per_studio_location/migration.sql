-- Add per-studio Location enum and column to Slot/Booking.
-- All existing rows are backfilled to 'ashdod' (the only studio so far).

-- 1. Create the enum type.
CREATE TYPE "Location" AS ENUM ('ashdod', 'tel_aviv');

-- 2. Add the column to Slot, defaulting to 'ashdod' so existing rows
--    receive a valid value automatically.
ALTER TABLE "Slot"
  ADD COLUMN "location" "Location" NOT NULL DEFAULT 'ashdod';

-- 3. Same for Booking.
ALTER TABLE "Booking"
  ADD COLUMN "location" "Location" NOT NULL DEFAULT 'ashdod';

-- 4. Replace the old (status, startsAt) Slot index with one that
--    includes the new location column for fast per-studio lookups.
DROP INDEX IF EXISTS "Slot_status_startsAt_idx";
CREATE INDEX "Slot_location_status_startsAt_idx"
  ON "Slot"("location", "status", "startsAt");

-- 5. Add a Booking index by (location, startsAt) used by the admin
--    listing and per-studio cleanup queries.
CREATE INDEX "Booking_location_startsAt_idx"
  ON "Booking"("location", "startsAt");
