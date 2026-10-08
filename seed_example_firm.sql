-- Example firm row. Run in the Supabase SQL editor to test end-to-end.
-- Replace the phone number with the Retell number you'll test against,
-- and the email with a real inbox you can check.

insert into firms (
  name, phone_numbers, timezone, business_hours,
  intake_criteria, urgency_criteria, transfer_number, notify_targets, roi_inputs
) values (
  'Riggs & Associates',
  array['+15125550000'],                       -- the dialed number that routes here
  'America/Chicago',
  '{"mon":{"open":"08:30","close":"17:30"},"tue":{"open":"08:30","close":"17:30"},"wed":{"open":"08:30","close":"17:30"},"thu":{"open":"08:30","close":"17:30"},"fri":{"open":"08:30","close":"17:30"},"sat":null,"sun":null}'::jsonb,
  'Takes auto, truck, motorcycle, pedestrian, and premises injury cases in Texas. Does not take workers'' comp, medical malpractice, or criminal matters.',
  'Hospitalization or surgery; commercial truck, bus, or rideshare involved; incident within the last 72 hours; a death.',
  '+15125550123',
  '{"email":["intake@riggslaw.example"],"urgent":{"email":["intake@riggslaw.example"],"sms":["+15125550123"]}}'::jsonb,
  '{"avg_case_value":25000,"signed_rate":0.25}'::jsonb
);
