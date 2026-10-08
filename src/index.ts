import Fastify from "fastify";
import { Retell } from "retell-sdk";
import { config } from "./config";
import { firmByNumber, upsertCall } from "./db";
import { computeTags } from "./tags";
import { resolveTargets, dispatchAll } from "./notify/dispatch";
import { sendEmail } from "./notify/email";
import type { RetellWebhook, IntakeFields } from "./types";

const app = Fastify({ logger: true });

// Capture the raw body so we can verify Retell's signature over the exact bytes.
app.addContentTypeParser("application/json", { parseAs: "string" }, (_req, body, done) => {
  try {
    (_req as any).rawBody = body;
    done(null, JSON.parse(body as string));
  } catch (err) {
    done(err as Error, undefined);
  }
});

app.get("/health", async () => ({ ok: true }));

app.post("/webhooks/retell", async (req, reply) => {
  const raw = (req as any).rawBody as string;
  const signature = req.headers["x-retell-signature"] as string | undefined;

  // 1. Verify signature — reject anything not signed by our Retell key.
  const valid =
    signature &&
    Retell.verify(raw, config.retellApiKey, signature);
  if (!valid) {
    req.log.warn("Rejected webhook: bad or missing signature");
    return reply.code(401).send({ error: "invalid signature" });
  }

  const wh = req.body as RetellWebhook;

  // The notification pipeline runs on call_analyzed (post-call analysis ready).
  if (wh.event !== "call_analyzed") {
    return reply.code(200).send({ ok: true, ignored: wh.event });
  }

  // 2. Map the call to a firm by the dialed number.
  const firm = await firmByNumber(wh.call.to_number);
  if (!firm) {
    req.log.error({ to: wh.call.to_number }, "No firm for dialed number");
    return reply.code(200).send({ ok: true, note: "no matching firm" });
  }

  const intake: IntakeFields = wh.call.call_analysis?.custom_analysis_data ?? {};
  const endedAt = wh.call.end_timestamp ? new Date(wh.call.end_timestamp) : new Date();

  // 3. Tags, 4. store, 5. notify.
  const tags = computeTags(intake, firm, endedAt);
  const callId = await upsertCall(firm.id, wh, intake, tags.afterHours);

  const targets = resolveTargets(firm, intake, tags);
  const anySucceeded = await dispatchAll(callId, targets);

  // Dead-letter: if nothing got through, alert internally.
  if (!anySucceeded && config.deadLetterEmail) {
    try {
      await sendEmail(
        config.deadLetterEmail,
        `⚠️ Lead notification failed for ${firm.name}`,
        `All channels failed for call ${wh.call.call_id}. Check notifications_log.`
      );
    } catch (err) {
      req.log.error({ err }, "Dead-letter alert also failed");
    }
  }

  return reply.code(200).send({ ok: true, call_id: callId, delivered: anySucceeded });
});

app
  .listen({ port: config.port, host: "0.0.0.0" })
  .then(() => app.log.info(`listening on ${config.port}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
