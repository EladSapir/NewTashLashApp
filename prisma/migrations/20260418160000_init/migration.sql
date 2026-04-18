-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('lashLift', 'browLift', 'naturalBrow', 'combo');

-- CreateEnum
CREATE TYPE "SlotStatus" AS ENUM ('available', 'pending', 'confirmed');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('pending');

-- CreateTable
CREATE TABLE "Slot" (
    "id" TEXT NOT NULL,
    "serviceId" "ServiceType" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "status" "SlotStatus" NOT NULL DEFAULT 'available',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Slot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "idNumber" TEXT NOT NULL,
    "policiesAccepted" BOOLEAN NOT NULL,
    "serviceId" "ServiceType" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "healthItems" TEXT[] NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Slot_serviceId_status_startsAt_idx" ON "Slot"("serviceId", "status", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_slotId_key" ON "Booking"("slotId");

-- CreateIndex
CREATE INDEX "Booking_status_createdAt_idx" ON "Booking"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "Slot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
