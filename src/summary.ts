import type { Firm, IntakeFields, Tags } from "./types";

const yn = (v?: boolean) => (v === true ? "Yes" : v === false ? "No" : "—");
const dash = (v?: string) => (v && v.trim() ? v.trim() : "—");

export function subjectLine(intake: IntakeFields, tags: Tags, firm: Firm): string {
  const flag = tags.urgent ? "🔴 URGENT" : "New";
  const when = tags.afterHours ? " (after-hours)" : "";
  const who = dash(intake.caller_name);
  return `${flag} PI lead${when} — ${who} for ${firm.name}`;
}

// Plain-text body used for both email and Slack (Slack renders it in a code block).
export function renderSummary(intake: IntakeFields, tags: Tags, firm: Firm): string {
  const header =
    (tags.urgent ? "🔴 Urgent lead" : "New lead") +
    (tags.afterHours ? ` — after-hours (${tags.localTimeLabel})` : ` (${tags.localTimeLabel})`);

  const lines = [
    header,
    "",
    `New personal injury call for ${firm.name}`,
    "",
    `Name:      ${dash(intake.caller_name)}`,
    `Phone:     ${dash(intake.callback_number)}`,
    `Incident:  ${dash(intake.incident_type)}${intake.incident_date ? `, ${intake.incident_date}` : ""}${intake.location ? `, ${intake.location}` : ""}`,
    `Injuries:  ${dash(intake.injuries)}`,
    `Treatment: ${dash(intake.treatment)}`,
    `Police:    ${yn(intake.police_report)}`,
    `Insurance: ${yn(intake.insurance_contacted)}`,
    `Attorney:  ${intake.existing_attorney === true ? "Already represented" : intake.existing_attorney === false ? "None yet" : "—"}`,
    `Fit:       ${intake.qualified === true ? "Qualified" : intake.qualified === false ? "Outside criteria" : "—"}`,
    `Transfer:  ${intake.transferred ? "Attempted → team" : "Not attempted"}`,
    "",
    `Summary: ${dash(intake.summary)}`,
  ];
  return lines.join("\n");
}

export function renderSms(intake: IntakeFields, tags: Tags): string {
  const flag = tags.urgent ? "🔴 URGENT PI lead" : "New PI lead";
  const bits = [
    dash(intake.caller_name),
    dash(intake.callback_number),
    dash(intake.incident_type),
  ].filter((b) => b !== "—");
  return `${flag}: ${bits.join(", ")}. Full details emailed.`;
}
