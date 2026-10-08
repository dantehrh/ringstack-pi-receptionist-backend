import "dotenv/config";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const config = {
  supabaseUrl: required("SUPABASE_URL"),
  supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  retellApiKey: required("RETELL_API_KEY"),
  sendgridApiKey: process.env.SENDGRID_API_KEY ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "alerts@ringstack.example",
  deadLetterEmail: process.env.DEAD_LETTER_EMAIL ?? "",
  port: Number(process.env.PORT ?? 3000),
};
