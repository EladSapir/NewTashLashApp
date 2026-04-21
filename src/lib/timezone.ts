export const ISRAEL_TIME_ZONE = "Asia/Jerusalem";

/**
 * Returns the offset (in minutes) between the given UTC instant and
 * Israel local time (accounts for IDT/IST automatically).
 */
function getIsraelOffsetMinutes(utcDate: Date): number {
  const dtf = new Intl.DateTimeFormat("en-GB", {
    timeZone: ISRAEL_TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(utcDate);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);

  const asIfUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return (asIfUtc - utcDate.getTime()) / 60000;
}

/**
 * Parses a "YYYY-MM-DDTHH:mm" (optionally :ss) string produced by an
 * `<input type="datetime-local">` as an Israel local wall-clock time and
 * returns the correct UTC `Date`. Works regardless of the runtime's
 * default timezone (e.g. UTC on Vercel).
 */
export function parseIsraelLocalDateTime(local: string): Date {
  const match = local.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/,
  );
  if (!match) {
    throw new Error("פורמט תאריך/שעה לא חוקי");
  }
  const [, y, mo, d, h, mi, s] = match;
  const year = Number(y);
  const month = Number(mo);
  const day = Number(d);
  const hour = Number(h);
  const minute = Number(mi);
  const second = Number(s ?? 0);

  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  const offset = getIsraelOffsetMinutes(new Date(utcGuess));
  let result = new Date(utcGuess - offset * 60000);

  const verifyOffset = getIsraelOffsetMinutes(result);
  if (verifyOffset !== offset) {
    result = new Date(utcGuess - verifyOffset * 60000);
  }
  return result;
}
