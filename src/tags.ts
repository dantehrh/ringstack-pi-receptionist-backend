import type { Firm, IntakeFields, Tags } from "./types";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

// Compute urgency + after-hours/weekend tags using the firm's timezone and hours.
export function computeTags(intake: IntakeFields, firm: Firm, endedAt: Date): Tags {
  const urgent = (intake.urgency ?? "").toLowerCase() === "urgent";

  // Resolve weekday + HH:mm in the firm's timezone (not the server's).
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: firm.timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(endedAt);

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekday = get("weekday").toLowerCase().slice(0, 3); // "sat"
  const hh = Number(get("hour"));
  const mm = Number(get("minute"));
  const minutes = hh * 60 + mm;

  const hours = firm.business_hours?.[weekday] ?? null;
  let afterHours = true;
  if (hours) {
    const open = toMinutes(hours.open);
    const close = toMinutes(hours.close);
    afterHours = !(minutes >= open && minutes < close);
  }

  const localTimeLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: firm.timezone,
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(endedAt);

  return { urgent, afterHours, localTimeLabel };
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export { DAY_KEYS };
