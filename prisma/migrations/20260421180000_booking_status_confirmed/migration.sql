-- Add `confirmed` to the BookingStatus enum so admins can approve bookings.
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'confirmed';
