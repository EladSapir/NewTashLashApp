import { BookingFlow } from "@/components/forms/booking-flow";
import { listAvailableSlots } from "@/lib/store";
import { SERVICES, ServiceId } from "@/lib/constants";

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const slots = await listAvailableSlots();
  const { service } = await searchParams;

  const initialServiceId: ServiceId | undefined =
    service && service in SERVICES ? (service as ServiceId) : undefined;

  return (
    <div className="mx-auto w-full max-w-3xl px-4">
      <BookingFlow slots={slots} initialServiceId={initialServiceId} />
    </div>
  );
}
