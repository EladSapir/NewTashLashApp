"use client";

import { ReactNode, useState } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Location } from "@/lib/types";
import { LocationPickerPopup } from "@/components/ui/location-picker-popup";

type Props = {
  /**
   * Destination URL to navigate to once the customer picks a studio.
   * The location is appended as a query parameter, e.g. `?location=ashdod`
   * or `&location=tel_aviv` if the URL already has a query string.
   */
  to: string;
  className?: string;
  ariaLabel?: string;
  children: ReactNode;
};

/**
 * Drop-in replacement for the `Link` CTAs on the home page.
 * On click, opens the studio picker popup. After the customer picks a
 * studio, it navigates to `${to}?location=${chosen}` (preserving any
 * existing query parameters such as `?service=...`).
 */
export function BookingCta({ to, className, ariaLabel, children }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleSelect = (location: Location) => {
    setOpen(false);
    const separator = to.includes("?") ? "&" : "?";
    // typedRoutes (next.config.mjs) only accepts statically-known route
    // strings; the location is dynamic so we cast to `Route` here.
    router.push(`${to}${separator}location=${location}` as Route);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className}
        aria-label={ariaLabel}
      >
        {children}
      </button>
      <LocationPickerPopup
        open={open}
        onClose={() => setOpen(false)}
        onSelect={handleSelect}
      />
    </>
  );
}
