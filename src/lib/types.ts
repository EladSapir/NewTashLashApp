export type ServiceType = string;

export type SlotStatus = "available" | "pending" | "confirmed";

/**
 * Studio location. Persisted on every Slot and Booking row.
 * Stored in the DB as a Postgres enum (`Location`) — `ashdod` and
 * `tel_aviv`. The TS string union must stay in sync with it.
 */
export type Location = "ashdod" | "tel_aviv";

export type Service = {
  id: string;
  durationMinutes: number;
};

export type Slot = {
  id: string;
  startsAt: string;
  status: SlotStatus;
  location: Location;
};

export type HealthItemId = string;

export type BookingStatus = "pending" | "confirmed";

export type BookingRequest = {
  id: string;
  slotId: string;
  fullName: string;
  phoneNumber: string;
  age: number;
  idNumber: string;
  policiesAccepted: boolean;
  serviceId: ServiceType;
  startsAt: string;
  location: Location;
  healthItems: HealthItemId[];
  status: BookingStatus;
  createdAt: string;
};

export type BookingSubmissionMeta = {
  healthDetails?: Record<string, string>;
  signatureDataUrl?: string;
  /** Client phone as submitted; used in notification so it always matches the form. */
  submittedPhoneNumber?: string;
};
