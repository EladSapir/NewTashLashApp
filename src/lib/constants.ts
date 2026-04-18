import { HealthItemId, Service } from "./types";

/* ==========================================================================
 * TREATMENTS LIST
 * --------------------------------------------------------------------------
 * Edit this file to add / remove / rename treatments or change their
 * durations. Rules:
 *   - `id` is an internal identifier. Keep it in English (letters only).
 *   - `durationMinutes` MUST be a multiple of 30 (slot size).
 *   - After adding a new treatment, also add a label + description under
 *     "services" in `messages/he.json` using the same id.
 *
 * The order of the entries here is the order shown to the client.
 * ========================================================================== */

export const SERVICES = {
  lashLift: {
    id: "lashLift",
    durationMinutes: 60,
  },
  browLiftFull: {
    id: "browLiftFull",
    durationMinutes: 90,
  },
  lashBrowLift: {
    id: "lashBrowLift",
    durationMinutes: 120,
  },
  browShape: {
    id: "browShape",
    durationMinutes: 60,
  },
  browMustache: {
    id: "browMustache",
    durationMinutes: 60,
  },
  lashLiftBrowShape: {
    id: "lashLiftBrowShape",
    durationMinutes: 120,
  },
} as const satisfies Record<string, Service>;

export type ServiceId = keyof typeof SERVICES;

export const SERVICE_IDS: ServiceId[] = Object.keys(SERVICES) as ServiceId[];

export const SLOT_INTERVAL_MINUTES = 30;

export const HEALTH_DECLARATION_ITEMS: HealthItemId[] = [
  "pregnant",
  "skinCondition",
  "allergy",
  "eyeInfection",
  "medication",
  "none",
];
