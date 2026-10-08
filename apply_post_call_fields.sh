#!/usr/bin/env bash
# Aligns the firm-facing template agent's post-call extraction fields to the
# backend intake schema (section 4 of the backend spec).
#
# Usage:
#   export RETELL_API_KEY=sk_...        # your Retell API key (never commit this)
#   bash apply_post_call_fields.sh
#
# This REPLACES the agent's post_call_analysis_data with the 3 Retell presets
# plus the 16 intake fields. It changes only that field; nothing else on the
# agent is touched. Run it on a DRAFT, then publish the agent in Retell.

set -euo pipefail

AGENT_ID="agent_bf9812c475623b9f8b7292d089"   # RingStack Client Receptionist — PI (Template)

if [ -z "${RETELL_API_KEY:-}" ]; then
  echo "ERROR: set RETELL_API_KEY first:  export RETELL_API_KEY=sk_..." >&2
  exit 1
fi

curl -sS -X PATCH "https://api.retellai.com/update-agent/${AGENT_ID}" \
  -H "Authorization: Bearer ${RETELL_API_KEY}" \
  -H "Content-Type: application/json" \
  --data @retell_post_call_fields.json | sed 's/,/,\n/g' | grep -E '"name"|post_call' || true

echo
echo "Done. Open the agent in Retell -> Post call extraction to confirm the 16 fields, then Publish."
