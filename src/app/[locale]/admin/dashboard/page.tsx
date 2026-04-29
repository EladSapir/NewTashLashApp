import { redirect } from "next/navigation";
import { SlotManager } from "@/components/forms/slot-manager";
import { BookingsManager } from "@/components/forms/bookings-manager";
import { requireAdminSession } from "@/lib/auth";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const authorized = await requireAdminSession();
  if (!authorized) redirect(`/${locale}/admin/login`);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 px-4">
      <div className="rounded-card bg-gradient-to-br from-burgundy to-mauve p-5 text-white shadow-soft">
        <h1 className="font-display text-2xl font-bold">ניהול תורים</h1>
        <p className="text-sm opacity-80">פתיחת טווחים, ניהול סלוטים ואישור בקשות.</p>
      </div>
      {/*
        SlotManager renders three sections: open-range form, then its
        children (the bookings list), then active slots. This keeps the
        slot state (load + refresh after a successful range opening)
        owned by SlotManager while still letting the dashboard place
        BookingsManager between the form and the active-slots list.
      */}
      <SlotManager>
        <BookingsManager />
      </SlotManager>
    </div>
  );
}
