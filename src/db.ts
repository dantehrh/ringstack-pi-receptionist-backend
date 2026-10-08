import { createClient } from "@supabase/supabase-js";
import { config } from "./config";
import type { Firm, IntakeFields, RetellWebhook } from "./types";

// Service-role client: bypasses RLS. Keep this key server-side only.
export const db = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

// Look up the firm whose phone_numbers array contains the dialed number.
export async function firmByNumber(toNumber?: string): Promise<Firm | null> {
  if (!toNumber) return null;
  const { data, error } = await db
    .from("firms")
    .select("*")
    .contains("phone_numbers", [toNumber])
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as Firm) ?? null;
}

// Idempotent upsert on retell_call_id. Returns the stored row's id.
export async function upsertCall(
  firmId: string,
  wh: RetellWebhook,
  intake: IntakeFields,
  afterHours: boolean
): Promise<string> {
  const c = wh.call;
  const row = {
    retell_call_id: c.call_id,
    firm_id: firmId,
    from_number: c.from_number ?? null,
    started_at: c.start_timestamp ? new Date(c.start_timestamp).toISOString() : null,
    ended_at: c.end_timestamp ? new Date(c.end_timestamp).toISOString() : null,
    after_hours: afterHours,
    caller_type: intake.caller_type ?? null,
    caller_name: intake.caller_name ?? null,
    callback_number: intake.callback_number ?? null,
    incident_type: intake.incident_type ?? null,
    incident_date: intake.incident_date ?? null,
    location: intake.location ?? null,
    injuries: intake.injuries ?? null,
    treatment: intake.treatment ?? null,
    police_report: intake.police_report ?? null,
    insurance_contacted: intake.insurance_contacted ?? null,
    existing_attorney: intake.existing_attorney ?? null,
    qualified: intake.qualified ?? null,
    urgency: intake.urgency ?? null,
    transferred: intake.transferred ?? null,
    language: intake.language ?? null,
    summary: intake.summary ?? c.call_analysis?.call_summary ?? null,
    transcript: c.transcript ?? null,
    recording_url: c.recording_url ?? null,
  };
  const { data, error } = await db
    .from("calls")
    .upsert(row, { onConflict: "retell_call_id" })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function logNotification(
  callId: string,
  channel: string,
  target: string,
  status: "sent" | "failed" | "retrying",
  error?: string
): Promise<void> {
  await db.from("notifications_log").upsert(
    { call_id: callId, channel, target, status, error: error ?? null, sent_at: new Date().toISOString() },
    { onConflict: "call_id,channel,target" }
  );
}
