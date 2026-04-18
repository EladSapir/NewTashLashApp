"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Clock3, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  HEALTH_DECLARATION_ITEMS,
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

function startsAtDay(iso: string) {
  return iso.slice(0, 10);
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

  // Clear any lingering step-level error whenever we navigate between steps.
  useEffect(() => {
    setStepError("");
    setSubmitAttempted(false);
  }, [step]);

  const availableDates = useMemo(() => {
    const unique = new Set(
      slots
        .filter((s) => s.status === "available")
        .map((slot) => startsAtDay(slot.startsAt)),
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
    if (step === 3 && !isValidHealthSelection(healthItems)) {
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
    if (!isValidHealthSelection(healthItems)) {
      setStep(3);
      setStepError(t("healthValidation"));
      return;
    }
    if (!policiesAccepted) {
      setStep(4);
      setStepError(t("policiesRequired"));
      return;
    }

    setStatus("loading");
    setStepError("");
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
      }),
    });

    if (!response.ok) {
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
                              { hour: "2-digit", minute: "2-digit" },
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
              <p className="font-semibold">{t("step3")}</p>
              {HEALTH_DECLARATION_ITEMS.map((item) => (
                <label
                  key={item}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-mauve/25 bg-white p-3 text-sm transition hover:border-mauve"
                >
                  <input
                    type="checkbox"
                    checked={healthItems.includes(item)}
                    className="accent-burgundy"
                    onChange={(event) => {
                      if (event.target.checked) {
                        if (item === "none") {
                          setHealthItems(["none"]);
                        } else {
                          setHealthItems((prev) => [
                            ...prev.filter((value) => value !== "none"),
                            item,
                          ]);
                        }
                      } else {
                        setHealthItems((prev) =>
                          prev.filter((value) => value !== item),
                        );
                      }
                      if (stepError) setStepError("");
                    }}
                  />
                  {t(`healthOptions.${item}`)}
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
                    {new Date(selectedSlot.startsAt).toLocaleString("he-IL")}
                  </p>
                ) : null}
              </div>
              <div className="rounded-xl border border-mauve/20 bg-white p-3 text-xs leading-relaxed whitespace-pre-line">
                {t("policiesText")}
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
            <ChevronRight className="h-4 w-4" />
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
