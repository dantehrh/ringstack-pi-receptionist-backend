# RingStack PI Receptionist — Backend

Ingests Retell call events, stores them per firm, and notifies the firm with an intake summary. Phase 1 scope: webhook receiver → Supabase → tags + summary → **email** (Slack implemented; SMS/CRM stubbed).

Stack: Node/TypeScript (Fastify) on Render, Supabase Postgres (project `RingStack PI Receptionist`, us-east-1).

## What's here

```
src/
  index.ts          Fastify server + POST /webhooks/retell (signature-verified)
  config.ts         env vars
  types.ts          Firm, IntakeFields, Retell webhook shapes
  db.ts             Supabase client, firm lookup, call upsert, notification log
  tags.ts           urgency + after-hours (firm timezone + business hours)
  summary.ts        intake summary + subject + SMS text
  notify/
    email.ts        SendGrid
    dispatch.ts     fan-out + retry + log (email, Slack; SMS stub)
render.yaml         Render blueprint
seed_example_firm.sql  one firm row to test with
```

## Setup

1. **Supabase** — the schema is already applied to the project. You need the **service-role key**: Supabase dashboard → Project Settings → API → `service_role` (secret — bypasses RLS, server-side only).
2. **SendGrid** — create an account, verify a sender address, create an API key.
3. **Retell** — grab your API key (used to verify webhook signatures) from the Retell dashboard.
4. Copy `.env.example` to `.env` and fill it in.

```bash
npm install
cp .env.example .env   # then fill in the secrets
npm run dev            # local dev on PORT (default 3000)
```

## Deploy to Render

1. Push this folder to a Git repo.
2. Render → New → Blueprint → point at the repo (`render.yaml` is picked up), **or** New → Web Service with build `npm install && npm run build` and start `npm start`.
3. Set the secret env vars in the Render dashboard (they are `sync: false` in the blueprint): `SUPABASE_SERVICE_ROLE_KEY`, `RETELL_API_KEY`, `SENDGRID_API_KEY`, `EMAIL_FROM`, `DEAD_LETTER_EMAIL`.
4. After deploy, your webhook URL is `https://<your-service>.onrender.com/webhooks/retell`.

## Wire up Retell

- In the firm-facing agent, set the **webhook URL** to the deployed `/webhooks/retell`.
- Make sure the agent's **post-call extraction** fields match `IntakeFields` (section 4 of the backend spec): `caller_type, caller_name, callback_number, incident_type, incident_date, location, injuries, treatment, police_report, insurance_contacted, existing_attorney, qualified, urgency, transferred, language, summary`.

## Test end-to-end

1. Run `seed_example_firm.sql` in the Supabase SQL editor (edit the phone number + email first).
2. Place a test call to the agent, or replay a `call_analyzed` event at the webhook.
3. Check: a row appears in `calls`, rows in `notifications_log`, and the summary lands in the inbox.

## Not yet built (next phases)

- SMS (Twilio) — stub in `notify/dispatch.ts`.
- CRM adapters (Clio/Filevine/Litify/CASEpeer or Zapier) — spec section 8.
- ROI dashboard (Metabase/Retool on this Postgres) — spec section 9.
- A durable job queue if volume grows (currently inline dispatch with retry).
