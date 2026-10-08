import type { Firm, IntakeFields, Tags } from "../types";
import { logNotification } from "../db";
import { sendEmail } from "./email";
import { renderSummary, renderSms, subjectLine } from "../summary";

interface Target {
  channel: "email" | "sms" | "slack";
  target: string;
  send: () => Promise<void>;
}

// Build the list of channel sends for this lead, honoring urgent overrides.
export function resolveTargets(
  firm: Firm,
  intake: IntakeFields,
  tags: Tags
): Target[] {
  const t = firm.notify_targets ?? {};
  const urgentOverride = tags.urgent ? t.urgent : undefined;

  const emails = urgentOverride?.email ?? t.email ?? [];
  const smsNums = urgentOverride?.sms ?? t.sms ?? [];
  const slacks = urgentOverride?.slack ?? t.slack ?? [];

  const subject = subjectLine(intake, tags, firm);
  const body = renderSummary(intake, tags, firm);
  const sms = renderSms(intake, tags);

  const targets: Target[] = [];
  for (const addr of emails) {
    targets.push({ channel: "email", target: addr, send: () => sendEmail(addr, subject, body) });
  }
  for (const num of smsNums) {
    targets.push({ channel: "sms", target: num, send: () => sendSms(num, sms) });
  }
  for (const s of slacks) {
    targets.push({ channel: "slack", target: s.webhookUrl, send: () => sendSlack(s.webhookUrl, body) });
  }
  return targets;
}

// Dispatch all targets independently with retry; log each outcome.
export async function dispatchAll(callId: string, targets: Target[]): Promise<boolean> {
  const results = await Promise.allSettled(
    targets.map((t) => withRetry(() => t.send()).then(
      () => logNotification(callId, t.channel, t.target, "sent"),
      (err) => logNotification(callId, t.channel, t.target, "failed", String(err?.message ?? err)).then(() => Promise.reject(err))
    ))
  );
  // true if at least one channel succeeded
  return results.some((r) => r.status === "fulfilled");
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, i)));
    }
  }
  throw lastErr;
}

// --- Slack via incoming webhook (no extra dependency) ---
async function sendSlack(webhookUrl: string, body: string): Promise<void> {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text: "```\n" + body + "\n```" }),
  });
  if (!res.ok) throw new Error(`Slack webhook ${res.status}`);
}

// --- SMS: stub. Wire up Twilio here when the SMS channel ships. ---
async function sendSms(_to: string, _body: string): Promise<void> {
  throw new Error("SMS channel not configured yet (add Twilio in notify/dispatch.ts)");
}
