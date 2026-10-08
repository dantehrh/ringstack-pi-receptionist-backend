// Shape of the per-firm config row (table: firms)
export interface Firm {
  id: string;
  name: string;
  phone_numbers: string[];
  timezone: string; // IANA, e.g. "America/Chicago"
  business_hours: BusinessHours;
  intake_criteria: string;
  urgency_criteria: string;
  transfer_number: string | null;
  transfer_rules: Record<string, unknown>;
  notify_targets: NotifyTargets;
  roi_inputs: Record<string, unknown>;
  booking: Record<string, unknown>;
}

// { mon: { open: "08:30", close: "17:30" }, sat: null, ... }  (keys: mon..sun)
export type BusinessHours = Record<string, { open: string; close: string } | null>;

export interface NotifyTargets {
  email?: string[];
  sms?: string[];
  slack?: { webhookUrl: string }[];
  crm?: { type: string; [k: string]: unknown };
  // Optional overrides for urgent leads; falls back to the above when absent.
  urgent?: { email?: string[]; sms?: string[]; slack?: { webhookUrl: string }[] };
}

// The intake fields extracted by the agent (Retell post-call custom_analysis_data)
export interface IntakeFields {
  caller_type?: string;
  caller_name?: string;
  callback_number?: string;
  incident_type?: string;
  incident_date?: string;
  location?: string;
  injuries?: string;
  treatment?: string;
  police_report?: boolean;
  insurance_contacted?: boolean;
  existing_attorney?: boolean;
  qualified?: boolean;
  urgency?: "urgent" | "standard" | "low" | string;
  transferred?: boolean;
  language?: string;
  summary?: string;
}

// Minimal view of the Retell webhook payload we rely on.
export interface RetellWebhook {
  event: "call_started" | "call_ended" | "call_analyzed" | string;
  call: {
    call_id: string;
    agent_id?: string;
    from_number?: string;
    to_number?: string;
    start_timestamp?: number; // ms epoch
    end_timestamp?: number; // ms epoch
    transcript?: string;
    recording_url?: string;
    disconnection_reason?: string;
    retell_llm_dynamic_variables?: Record<string, string>;
    call_analysis?: {
      custom_analysis_data?: IntakeFields;
      call_summary?: string;
    };
  };
}

export interface Tags {
  urgent: boolean;
  afterHours: boolean;
  localTimeLabel: string; // e.g. "Sat 9:42 PM CT"
}
