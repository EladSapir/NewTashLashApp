import { redirect } from "next/navigation";
import { BookingFlow } from "@/components/forms/booking-flow";
import { listAvailableSlots } from "@/lib/store";
import { isValidLocation, SERVICES, ServiceId } from "@/lib/constants";

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; location?: string }>;
}) {
  const { service, location } = await searchParams;

  // The booking page is always entered through the location-picker
  // popup on the home page, so a `location` query param is mandatory.
  // If it's missing or invalid, send the customer back to the home
  // page where they'll go through the popup flow again.
  if (!isValidLocation(location)) {
    redirect("/he");
  }

  const slots = await listAvailableSlots(location);

  const initialServiceId: ServiceId | undefined =
    service && service in SERVICES ? (service as ServiceId) : undefined;

  return (
    <div className="mx-auto w-full max-w-3xl px-4">
      <BookingFlow
        slots={slots}
        initialServiceId={initialServiceId}
        location={location}
      />
    </div>
  );
}
