"use client";

import {
  FormEvent,
  PointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock3, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  HEALTH_NONE_ID,
  SERVICE_HEALTH_FORMS,
  SERVICES,
  SERVICE_IDS,
  SLOT_INTERVAL_MINUTES,
  ServiceId,
} from "@/lib/constants";
import { HealthItemId, Slot } from "@/lib/types";
import {
  isValidAge,
  isValidHealthSelection,
  isValidIdNumber,
  isValidPhoneNumber,
} from "@/lib/validation";
import { MonthlyCalendar } from "@/components/ui/monthly-calendar";

type Props = {
  slots: Slot[];
  initialServiceId?: ServiceId;
};

type ExistingBookingSummary = {
  id: string;
  serviceId: string;
  startsAt: string;
};

type QuotaError = {
  reason: "duplicate_service_booking" | "max_future_bookings_reached";
  existingBookings: ExistingBookingSummary[];
};

const WHATSAPP_URL = "http://wa.me/972526043268";

const stepVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

/**
 * Flow:
 *   1. Date → Service → Time (progressive reveal, times filtered by duration fit)
 *   2. Personal details
 *   3. Health declaration
 *   4. Clinic policies + confirm & submit
 */
const TOTAL_STEPS = 4;

const ISRAEL_DAY_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jerusalem",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function startsAtDay(iso: string) {
  return ISRAEL_DAY_FORMATTER.format(new Date(iso));
}

/**
 * For every `available` slot on `day`, compute how many consecutive
 * slots (in 30-min units) are available starting from it. This lets us
 * know whether a treatment of `N` minutes can start at that time.
 */
function buildRunLengths(daySlots: Slot[]) {
  const sorted = [...daySlots].sort((a, b) =>
    a.startsAt.localeCompare(b.startsAt),
  );
  const intervalMs = SLOT_INTERVAL_MINUTES * 60_000;

  // Walk from the end so we can accumulate "run from here" efficiently.
  const runLengths: Record<string, number> = {};
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    const current = sorted[i];
    const nextStart =
      new Date(current.startsAt).getTime() + intervalMs;
    const nextSlot =
      i + 1 < sorted.length && sorted[i + 1].status === "available"
        ? sorted[i + 1]
        : undefined;
    const nextIsContiguous =
      nextSlot &&
      new Date(nextSlot.startsAt).getTime() === nextStart;
    runLengths[current.id] =
      current.status === "available"
        ? 1 + (nextIsContiguous ? runLengths[nextSlot!.id] : 0)
        : 0;
  }

  return runLengths;
}

export function BookingFlow({ slots, initialServiceId }: Props) {
  const router = useRouter();
  const t = useTranslations("booking");
  const services = useTranslations("services");
  const common = useTranslations("common");

  const [step, setStep] = useState(1);
  const [slotId, setSlotId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [serviceId, setServiceId] = useState<ServiceId | "">(
    initialServiceId ?? "",
  );
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [age, setAge] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [healthItems, setHealthItems] = useState<HealthItemId[]>([]);
  const [healthDetails, setHealthDetails] = useState<Record<string, string>>({});
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [policiesAccepted, setPoliciesAccepted] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [stepError, setStepError] = useState("");
  /**
   * Tracks whether the user has actually attempted to submit the form.
   * The "חובה לאשר נהלי קליניקה" error should *only* be visible after a
   * real submit attempt — never on first arrival at step 4, and never
   * carried over from a previous session / step change.
   */
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [signatureError, setSignatureError] = useState("");
  const [quotaError, setQuotaError] = useState<QuotaError | null>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const signatureInitializedRef = useRef(false);
  const drawingRef = useRef(false);
  const signatureHasStrokeRef = useRef(false);

  const selectedServiceForm = serviceId ? SERVICE_HEALTH_FORMS[serviceId] : undefined;
  const medicalOptionIds = useMemo(
    () => new Set(selectedServiceForm?.medicalOptions.map((item) => item.id) ?? []),
    [selectedServiceForm],
  );
  const consentOptionIds = useMemo(
    () => new Set(selectedServiceForm?.consentOptions.map((item) => item.id) ?? []),
    [selectedServiceForm],
  );

  // Clear any lingering step-level error whenever we navigate between steps.
  useEffect(() => {
    setStepError("");
    setSubmitAttempted(false);
    setSignatureError("");
    setQuotaError(null);
    window.scrollTo({ top: 0, behavior: "auto" });
    if (step !== 4) {
      signatureInitializedRef.current = false;
    }
  }, [step]);

  useEffect(() => {
    setHealthItems([]);
    setHealthDetails({});
  }, [serviceId]);

  const initSignatureCanvas = useCallback((canvas: HTMLCanvasElement) => {
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === 0 || height === 0) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.lineWidth = 2;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#3a2d34";
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    signatureInitializedRef.current = true;
  }, []);

  const handleSignatureRef = useCallback(
    (node: HTMLCanvasElement | null) => {
      signatureCanvasRef.current = node;
      if (!node) {
        signatureInitializedRef.current = false;
        return;
      }
      requestAnimationFrame(() => initSignatureCanvas(node));
    },
    [initSignatureCanvas],
  );

  useEffect(() => {
    const handleResize = () => {
      const canvas = signatureCanvasRef.current;
      if (!canvas) return;
      initSignatureCanvas(canvas);
      signatureHasStrokeRef.current = false;
      setSignatureDataUrl("");
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [initSignatureCanvas]);

  const availableDates = useMemo(() => {
    // Clients may only pick dates strictly after "today" in Israel.
    const todayIsr = ISRAEL_DAY_FORMATTER.format(new Date());
    const unique = new Set(
      slots
        .filter((s) => s.status === "available")
        .map((slot) => startsAtDay(slot.startsAt))
        .filter((day) => day > todayIsr),
    );
    return [...unique].sort((a, b) => a.localeCompare(b));
  }, [slots]);

  const slotsOnDay = useMemo(
    () => slots.filter((slot) => startsAtDay(slot.startsAt) === selectedDate),
    [slots, selectedDate],
  );

  const runLengths = useMemo(() => buildRunLengths(slotsOnDay), [slotsOnDay]);

  const requiredUnits = serviceId
    ? SERVICES[serviceId].durationMinutes / SLOT_INTERVAL_MINUTES
    : 0;

  const fittingSlots = useMemo(() => {
    if (!serviceId) return [];
    return slotsOnDay
      .filter((s) => s.status === "available")
      .filter((s) => runLengths[s.id] >= requiredUnits)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }, [serviceId, slotsOnDay, runLengths, requiredUnits]);

  const selectedSlot = slots.find((slot) => slot.id === slotId);

  const getCanvasPoint = (
    event: PointerEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement,
  ) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const startSignature = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    if (!signatureInitializedRef.current) {
      initSignatureCanvas(canvas);
    }
    const context = canvas.getContext("2d");
    if (!context) return;

    drawingRef.current = true;
    signatureHasStrokeRef.current = true;
    setSignatureError("");
    const { x, y } = getCanvasPoint(event, canvas);
    context.beginPath();
    context.moveTo(x, y);
  };

  const drawSignature = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const { x, y } = getCanvasPoint(event, canvas);
    context.lineTo(x, y);
    context.stroke();
  };

  const finishSignature = () => {
    const canvas = signatureCanvasRef.current;
    const context = canvas?.getContext("2d");
    drawingRef.current = false;
    context?.closePath();

    if (canvas && signatureHasStrokeRef.current) {
      setSignatureDataUrl(canvas.toDataURL("image/png"));
      setSignatureError("");
    }
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    signatureHasStrokeRef.current = false;
    setSignatureDataUrl("");
    setSignatureError("");
  };

  const goBack = () => {
    if (step === 1) {
      router.push("/he");
      return;
    }
    setStepError("");
    setStep((current) => Math.max(1, current - 1));
  };

  const next = () => {
    if (step === 1) {
      if (!selectedDate) {
        setStepError(t("pickDateFirst"));
        return;
      }
      if (!serviceId) {
        setStepError(t("pickServiceFirst"));
        return;
      }
      if (!slotId) {
        setStepError(t("dateTimeRequired"));
        return;
      }
    }
    if (step === 2) {
      if (fullName.trim().length < 2) {
        setStepError(t("fullNameRequired"));
        return;
      }
      if (!isValidPhoneNumber(phoneNumber)) {
        setStepError(t("phoneInvalid"));
        return;
      }
      if (!isValidAge(Number(age))) {
        setStepError(t("ageInvalid"));
        return;
      }
      if (!isValidIdNumber(idNumber)) {
        setStepError(t("idInvalid"));
        return;
      }
    }
    if (step === 3 && !isValidHealthSelection(healthItems, selectedServiceForm)) {
      setStepError(t("healthValidation"));
      return;
    }
    setStepError("");
    setStep((current) => Math.min(TOTAL_STEPS, current + 1));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitAttempted(true);

    if (!selectedSlot || !serviceId) {
      setStep(1);
      setStepError(t("dateTimeRequired"));
      return;
    }
    if (!isValidPhoneNumber(phoneNumber)) {
      setStep(2);
      setStepError(t("phoneInvalid"));
      return;
    }
    const parsedAge = Number(age);
    if (!isValidAge(parsedAge)) {
      setStep(2);
      setStepError(t("ageInvalid"));
      return;
    }
    if (!isValidIdNumber(idNumber)) {
      setStep(2);
      setStepError(t("idInvalid"));
      return;
    }
    if (!isValidHealthSelection(healthItems, selectedServiceForm)) {
      setStep(3);
      setStepError(t("healthValidation"));
      return;
    }
    if (!signatureDataUrl) {
      setStep(4);
      setSignatureError(t("signatureRequired"));
      return;
    }
    if (!policiesAccepted) {
      setStep(4);
      setStepError(t("policiesRequired"));
      return;
    }

    setStatus("loading");
    setStepError("");
    setQuotaError(null);
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slotId,
        fullName,
        phoneNumber,
        age: parsedAge,
        idNumber,
        policiesAccepted,
        serviceId,
        startsAt: selectedSlot.startsAt,
        healthItems,
        healthDetails,
        signatureDataUrl,
      }),
    });

    if (!response.ok) {
      let payload:
        | {
            error?: string;
            reason?: QuotaError["reason"];
            existingBookings?: ExistingBookingSummary[];
          }
        | undefined;
      try {
        payload = (await response.json()) as typeof payload;
      } catch {
        payload = undefined;
      }
      const serverError = payload?.error ?? "";

      if (
        payload?.reason === "duplicate_service_booking" ||
        payload?.reason === "max_future_bookings_reached"
      ) {
        setQuotaError({
          reason: payload.reason,
          existingBookings: payload.existingBookings ?? [],
        });
        setStatus("idle");
        return;
      }

      if (
        serverError.includes("not available") ||
        serverError.includes("לא זמין") ||
        serverError.includes("נתפס")
      ) {
        setStep(1);
        setSlotId("");
        setStepError("השעה שבחרת כבר לא פנויה. בחרי שעה אחרת.");
        setStatus("idle");
        return;
      }
      setStatus("error");
      return;
    }

    setStatus("success");
    router.push("/he?success=1");
  };

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <form
      onSubmit={submit}
      dir="rtl"
      className="space-y-5 rounded-card border border-mauve/15 bg-white/90 p-5 shadow-soft backdrop-blur"
    >
      <div>
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold text-burgundy">
            {t("title")}
          </h2>
          <span className="text-xs font-medium text-ink/50">
            {step} / {TOTAL_STEPS}
          </span>
        </div>
        <p className="text-sm text-ink/70">{t("subtitle")}</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-mauve/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-rose to-burgundy"
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      </div>

      {stepError && step !== 4 ? (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border-2 border-red-300 bg-red-50 p-3 text-sm font-bold text-red-700 shadow-sm"
        >
          {stepError}
        </motion.p>
      ) : null}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          variants={stepVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {step === 1 && (
            <div className="space-y-5">
              {/* 1a. DATE */}
              <div>
                <p className="mb-2 font-semibold">{t("selectDate")}</p>
                <MonthlyCalendar
                  availableDates={availableDates}
                  selectedDate={selectedDate}
                  minDate={(() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    return tomorrow;
                  })()}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setSlotId("");
                    if (stepError) setStepError("");
                  }}
                />
              </div>

              {/* 1b. SERVICE (after date) — skipped when the service was
                  pre-selected from the home page */}
              {selectedDate && !initialServiceId && (
                <div>
                  <p className="mb-2 font-semibold">{t("selectService")}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {SERVICE_IDS.map((id) => {
                      const active = serviceId === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            setServiceId(id);
                            setSlotId("");
                            if (stepError) setStepError("");
                          }}
                          className={`rounded-xl border px-3 py-3 text-right text-sm font-semibold transition ${
                            active
                              ? "border-burgundy bg-burgundy text-white shadow-soft"
                              : "border-mauve/25 bg-white hover:border-mauve"
                          }`}
                        >
                          {services(id)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 1c. TIME (after service) */}
              {selectedDate && serviceId && (
                <div>
                  <p className="mb-2 font-semibold">{t("selectTime")}</p>
                  {fittingSlots.length === 0 ? (
                    <p className="rounded-xl border border-mauve/20 bg-blush/30 p-3 text-sm text-ink/60">
                      {t("noSlotsForService")}
                    </p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-3">
                      {fittingSlots.map((slot) => {
                        const active = slotId === slot.id;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => {
                              setSlotId(slot.id);
                              if (stepError) setStepError("");
                            }}
                            className={`flex items-center justify-center gap-1 rounded-xl border px-3 py-3 text-sm transition ${
                              active
                                ? "border-burgundy bg-burgundy text-white shadow-soft"
                                : "border-mauve/25 bg-white text-ink hover:border-mauve"
                            }`}
                          >
                            <Clock3 className="h-4 w-4" />
                            {new Date(slot.startsAt).toLocaleTimeString(
                              "he-IL",
                              {
                                timeZone: "Asia/Jerusalem",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="font-semibold">{t("step2")}</p>
              <input
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (stepError) setStepError("");
                }}
                className="w-full rounded-xl border border-mauve/25 bg-white px-3 py-3 focus:border-mauve focus:outline-none"
                placeholder={t("fullName")}
                required
              />
              <input
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  if (stepError) setStepError("");
                }}
                className="w-full rounded-xl border border-mauve/25 bg-white px-3 py-3 focus:border-mauve focus:outline-none"
                placeholder={t("phoneNumber")}
                inputMode="tel"
                required
              />
              <input
                value={age}
                onChange={(e) => {
                  setAge(e.target.value);
                  if (stepError) setStepError("");
                }}
                className="w-full rounded-xl border border-mauve/25 bg-white px-3 py-3 focus:border-mauve focus:outline-none"
                placeholder={t("age")}
                inputMode="numeric"
                required
              />
              <input
                value={idNumber}
                onChange={(e) => {
                  setIdNumber(e.target.value);
                  if (stepError) setStepError("");
                }}
                className="w-full rounded-xl border border-mauve/25 bg-white px-3 py-3 focus:border-mauve focus:outline-none"
                placeholder={t("idNumber")}
                inputMode="numeric"
                required
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2">
              <p className="font-semibold">{selectedServiceForm?.title ?? t("step3")}</p>
              <p className="text-sm text-ink/70">{selectedServiceForm?.intro}</p>
              <p className="text-sm font-medium text-ink/80">{t("medicalSection")}</p>
              {selectedServiceForm?.medicalOptions.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-mauve/25 bg-white p-3 text-sm transition hover:border-mauve"
                >
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={healthItems.includes(item.id)}
                      className="accent-burgundy"
                      onChange={(event) => {
                        setHealthItems((prev) => {
                          const nonMedical = prev.filter((value) => !medicalOptionIds.has(value));
                          const currentMedical = prev.filter((value) => medicalOptionIds.has(value));

                          let nextMedical: string[];
                          if (event.target.checked) {
                            if (item.id === HEALTH_NONE_ID) {
                              nextMedical = [HEALTH_NONE_ID];
                            } else {
                              nextMedical = [
                                ...currentMedical.filter((value) => value !== HEALTH_NONE_ID),
                                item.id,
                              ];
                            }
                          } else {
                            nextMedical = currentMedical.filter((value) => value !== item.id);
                          }

                          return [...nonMedical, ...nextMedical];
                        });

                        if (!event.target.checked) {
                          setHealthDetails((prev) => {
                            const nextDetails = { ...prev };
                            delete nextDetails[item.id];
                            return nextDetails;
                          });
                        }
                        if (stepError) setStepError("");
                      }}
                    />
                    {item.label}
                  </label>
                  {item.allowDetails && healthItems.includes(item.id) ? (
                    <textarea
                      value={healthDetails[item.id] ?? ""}
                      onChange={(event) =>
                        setHealthDetails((prev) => ({
                          ...prev,
                          [item.id]: event.target.value,
                        }))
                      }
                      placeholder={item.detailsLabel ?? t("detailsPlaceholder")}
                      className="mt-2 min-h-20 w-full rounded-xl border border-mauve/25 bg-blush/20 px-3 py-2 text-sm focus:border-mauve focus:outline-none"
                    />
                  ) : null}
                </div>
              ))}

              <p className="pt-3 text-sm font-medium text-ink/80">
                {selectedServiceForm?.consentTitle ?? t("consentSection")}
              </p>
              {selectedServiceForm?.consentOptions.map((item) => (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-mauve/25 bg-white p-3 text-sm transition hover:border-mauve"
                >
                  <input
                    type="checkbox"
                    checked={healthItems.includes(item.id)}
                    className="accent-burgundy"
                    onChange={(event) => {
                      setHealthItems((prev) => {
                        const nonConsent = prev.filter((value) => !consentOptionIds.has(value));
                        const currentConsent = prev.filter((value) => consentOptionIds.has(value));
                        const nextConsent = event.target.checked
                          ? [...currentConsent, item.id]
                          : currentConsent.filter((value) => value !== item.id);
                        return [...nonConsent, ...new Set(nextConsent)];
                      });
                      if (stepError) setStepError("");
                    }}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3 text-sm">
              <p className="font-semibold">{t("step4")}</p>
              <div className="rounded-xl border border-mauve/20 bg-blush/30 p-3">
                <p>{fullName}</p>
                <p>{phoneNumber}</p>
                <p>
                  {t("age")}: {age}
                </p>
                <p>
                  {t("idNumber")}: {idNumber}
                </p>
                {serviceId ? (
                  <p className="font-semibold">{services(serviceId)}</p>
                ) : null}
                {selectedSlot ? (
                  <p className="font-semibold text-burgundy">
                    {new Date(selectedSlot.startsAt).toLocaleString("he-IL", {
                      timeZone: "Asia/Jerusalem",
                    })}
                  </p>
                ) : null}
              </div>
              <div className="rounded-xl border border-mauve/20 bg-white p-3 text-sm leading-relaxed whitespace-pre-line">
                {t("policiesText")}
              </div>
              <div className="rounded-xl border border-mauve/25 bg-white p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-semibold">{t("signatureTitle")}</p>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="rounded-full border border-mauve/30 px-3 py-1 text-xs hover:bg-mauve/5"
                  >
                    {t("clearSignature")}
                  </button>
                </div>
                <p className="mb-2 text-xs text-ink/70">{t("signatureHint")}</p>
                <canvas
                  ref={handleSignatureRef}
                  className="h-40 w-full touch-none rounded-lg border border-dashed border-mauve/40 bg-white"
                  onPointerDown={startSignature}
                  onPointerMove={drawSignature}
                  onPointerUp={finishSignature}
                  onPointerLeave={finishSignature}
                />
              </div>
              <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-mauve/25 bg-white p-3">
                <input
                  type="checkbox"
                  className="mt-0.5 accent-burgundy"
                  checked={policiesAccepted}
                  onChange={(event) => {
                    setPoliciesAccepted(event.target.checked);
                    setSubmitAttempted(false);
                    if (stepError) setStepError("");
                  }}
                />
                <span>{t("policiesConfirm")}</span>
              </label>
              {signatureError ? (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border-2 border-red-300 bg-red-50 p-3 text-sm font-bold text-red-700 shadow-sm"
                >
                  {signatureError}
                </motion.p>
              ) : null}
              {submitAttempted && stepError ? (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border-2 border-red-300 bg-red-50 p-3 text-sm font-bold text-red-700 shadow-sm"
                >
                  {stepError}
                </motion.p>
              ) : null}
              {status === "success" ? (
                <p className="rounded-xl bg-green-100 p-3 text-green-800">
                  {t("success")}
                </p>
              ) : null}
              {quotaError ? (
                <div
                  role="alert"
                  className="space-y-3 rounded-xl border-2 border-red-300 bg-red-50 p-4 text-red-800"
                >
                  <p className="font-bold">
                    {quotaError.reason === "duplicate_service_booking"
                      ? t("quotaDuplicate")
                      : t("quotaMax")}
                  </p>
                  {quotaError.existingBookings.length > 0 ? (
                    <div className="rounded-lg border border-red-200 bg-white/70 p-3 text-sm text-ink">
                      <p className="mb-1 font-semibold">{t("existingBookings")}</p>
                      <ul className="space-y-1">
                        {quotaError.existingBookings.map((existing) => (
                          <li key={existing.id}>
                            • {services(existing.serviceId)} ·{" "}
                            {new Date(existing.startsAt).toLocaleString("he-IL", {
                              timeZone: "Asia/Jerusalem",
                            })}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <p className="text-sm">{t("quotaWhatsappHint")}</p>
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-soft transition hover:bg-emerald-700"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden />
                    {common("whatsappCta")}
                  </a>
                </div>
              ) : null}
              {status === "error" ? (
                <div className="space-y-2 rounded-xl border-2 border-red-300 bg-red-50 p-3 text-red-700">
                  <p className="font-bold">{common("apiError")}</p>
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-soft transition hover:bg-emerald-700"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {common("whatsappCta")}
                  </a>
                </div>
              ) : null}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-1 rounded-full border border-mauve/30 px-4 py-2 text-sm transition hover:bg-mauve/5"
        >
          <ChevronRight className="h-4 w-4" />
          {t("back")}
        </button>
        {step < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={next}
            className="inline-flex items-center gap-1 rounded-full bg-burgundy px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-mauve"
          >
            {t("next")}
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={status === "loading"}
            className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white shadow-soft transition disabled:opacity-60"
          >
            {status === "loading" ? "..." : t("submit")}
          </button>
        )}
      </div>
    </form>
  );
}
