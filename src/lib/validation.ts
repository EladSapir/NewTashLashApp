import { HealthItemId } from "./types";

export function isValidPhoneNumber(phoneNumber: string) {
  const normalized = phoneNumber.replace(/[^\d+]/g, "");
  return /^(\+?\d{9,15})$/.test(normalized);
}

export function isValidHealthSelection(items: HealthItemId[]) {
  if (items.length === 0) return false;
  if (items.includes("none")) return items.length === 1;
  return items.length >= 1;
}

export function isValidAge(value: number) {
  return Number.isInteger(value) && value >= 16 && value <= 120;
}

/**
 * Validates an Israeli ID number ("תעודת זהות") using the standard
 * Luhn-like checksum defined by the Ministry of the Interior.
 *
 * Rules:
 *   1. Strip non-digits.
 *   2. Must be 1–9 digits (shorter numbers are valid — they get left-padded
 *      with zeros up to 9 digits).
 *   3. Multiply each digit by an alternating weight of 1, 2, 1, 2, ...
 *      starting from the left-most digit of the 9-digit form.
 *   4. If a product is ≥ 10, replace it with the sum of its digits
 *      (equivalent to subtracting 9).
 *   5. Sum all results — the total must be divisible by 10.
 */
export function isValidIdNumber(idNumber: string) {
  const digits = idNumber.replace(/\D/g, "");
  if (digits.length === 0 || digits.length > 9) return false;

  // Left-pad to exactly 9 digits.
  const padded = digits.padStart(9, "0");

  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    const digit = Number(padded[i]);
    const weight = (i % 2) + 1;
    const product = digit * weight;
    sum += product > 9 ? product - 9 : product;
  }

  return sum % 10 === 0;
}
