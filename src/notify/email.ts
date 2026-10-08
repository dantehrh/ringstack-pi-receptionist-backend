import sgMail from "@sendgrid/mail";
import { config } from "../config";

let ready = false;
function ensure() {
  if (!config.sendgridApiKey) throw new Error("SENDGRID_API_KEY not set");
  if (!ready) {
    sgMail.setApiKey(config.sendgridApiKey);
    ready = true;
  }
}

export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  ensure();
  await sgMail.send({
    to,
    from: config.emailFrom,
    subject,
    text,
  });
}
