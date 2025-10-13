/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// const {setGlobalOptions} = require("firebase-functions");
// const {onRequest} = require("firebase-functions/https");
// const logger = require("firebase-functions/logger");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.

// setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
/* global Buffer, console */
const { onRequest } = require("firebase-functions/v2/https")
const { setGlobalOptions } = require("firebase-functions/v2/options")
const { defineSecret } = require("firebase-functions/params")
const sgMail = require("@sendgrid/mail")

setGlobalOptions({ region: "australia-southeast1", maxInstances: 10 })

const SENDGRID_API_KEY = defineSecret("SENDGRID_API_KEY")
const MAIL_SENDER  = defineSecret("MAIL_SENDER")

const MAX_RECIPIENTS = 5
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ALLOWED = new Set(["application/pdf","text/plain","text/markdown","application/json","text/x-log"])

exports.sendMail = onRequest({ cors: true, secrets: [SENDGRID_API_KEY, MAIL_SENDER] }, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*")
  res.set("Access-Control-Allow-Headers", "content-type")
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.set("Vary", "Origin")
  if (req.method === "OPTIONS") {
    return res.status(204).send("")
  }
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed")

  const key = SENDGRID_API_KEY.value()
  const sender = MAIL_SENDER.value()
  if (!key || !sender) return res.status(500).json({ ok:false, error:"Missing SENDGRID_API_KEY or MAIL_SENDER" })
  sgMail.setApiKey(key)

  try {
    const { to, subject, text, html, fileBase64, fileName, mimeType } = req.body || {}
    if (!to) return res.status(400).json({ ok:false, error:"\"to\" is required." })
    if (!subject || (!text && !html)) return res.status(400).json({ ok:false, error:"Subject and either text or html are required." })

    const toList = String(to).split(",").map(s=>s.trim()).filter(Boolean)
    if (!toList.length) return res.status(400).json({ ok:false, error:"At least one recipient is required." })
    if (toList.length > MAX_RECIPIENTS) return res.status(400).json({ ok:false, error:`Up to ${MAX_RECIPIENTS} recipients are allowed per request.` })
    for (const e of toList) if (!emailRe.test(e)) return res.status(400).json({ ok:false, error:`Invalid email: ${e}` })

    let attachments
    if (fileBase64) {
      const rawBytes = Buffer.from(fileBase64,"base64").length
      if (rawBytes > 10*1024*1024) return res.status(400).json({ ok:false, error:"Attachment too large (>~10MB)." })
      const okType = mimeType && (mimeType.startsWith("image/") || ALLOWED.has(mimeType))
      if (!okType) return res.status(400).json({ ok:false, error:`Unsupported attachment type: ${mimeType||"unknown"}` })
      attachments = [{ content:fileBase64, filename:fileName||"attachment", type:mimeType||"application/octet-stream", disposition:"attachment" }]
    }

    await sgMail.send({ to: toList, from: { email: sender, name: "Women Healthy Resource" }, subject, text, html, attachments })
    res.json({ ok:true })
  } catch (e) {
    console.error("SENDMAIL_ERROR:", e?.response?.body || e)
    res.status(500).json({ ok:false, error:"Failed to send email." })
  }
})


