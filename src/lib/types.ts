export type ServiceType = string;

export type SlotStatus = "available" | "pending" | "confirmed";

export type Service = {
  id: string;
  durationMinutes: number;
};

export type Slot = {
  id: string;
  startsAt: string;
  status: SlotStatus;
};

export type HealthItemId = string;

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
  healthItems: HealthItemId[];
  status: "pending";
  createdAt: string;
};

export type BookingSubmissionMeta = {
  healthDetails?: Record<string, string>;
  signatureDataUrl?: string;
};
