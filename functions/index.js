/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// const {setGlobalOptions} = require("firebase-functions");
// const { onRequest } = require('firebase-functions/https')
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
/* eslint-env node */

const { onRequest } = require('firebase-functions/v2/https')
const { setGlobalOptions } = require('firebase-functions/v2/options')

const functions = require('firebase-functions')
const sgMail = require('@sendgrid/mail')

setGlobalOptions({ region: 'australia-southeast1', maxInstances: 10 })

const MAX_RECIPIENTS = 5
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ALLOWED = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/json',
  'text/x-log',
])

exports.sendMail = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed')

  const key = functions.config().sendgrid?.key
  const sender = functions.config().mail?.sender
  if (!key || !sender) {
    console.error('Missing runtime config', { hasKey: !!key, hasSender: !!sender })
    return res.status(500).json({ ok: false, error: 'Missing sendgrid.key or mail.sender' })
  }
  sgMail.setApiKey(key)

  try {
    const { to, subject, text, html, fileBase64, fileName, mimeType } = req.body || {}

    if (!to) return res.status(400).json({ ok: false, error: '"to" is required.' })
    if (!subject || (!text && !html)) {
      return res
        .status(400)
        .json({ ok: false, error: 'Subject and either text or html are required.' })
    }

    const toList = String(to)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (!toList.length)
      return res.status(400).json({ ok: false, error: 'At least one recipient is required.' })
    if (toList.length > MAX_RECIPIENTS) {
      return res
        .status(400)
        .json({ ok: false, error: `Up to ${MAX_RECIPIENTS} recipients are allowed per request.` })
    }
    for (const e of toList) {
      if (!emailRe.test(e)) return res.status(400).json({ ok: false, error: `Invalid email: ${e}` })
    }

    let attachments
    if (fileBase64) {
      const rawBytes = Buffer.from(fileBase64, 'base64').length
      if (rawBytes > 10 * 1024 * 1024) {
        return res.status(400).json({ ok: false, error: 'Attachment is too large (> ~10MB).' })
      }
      const okType = mimeType && (mimeType.startsWith('image/') || ALLOWED.has(mimeType))
      if (!okType) {
        return res
          .status(400)
          .json({ ok: false, error: `Unsupported attachment type: ${mimeType || 'unknown'}` })
      }
      attachments = [
        {
          content: fileBase64,
          filename: fileName || 'attachment',
          type: mimeType || 'application/octet-stream',
          disposition: 'attachment',
        },
      ]
    }

    const msg = {
      to: toList,
      from: sender,
      subject,
      text: text || undefined,
      html: html || undefined,
      attachments,
    }

    await sgMail.send(msg)
    return res.json({ ok: true })
  } catch (e) {
    console.error('Send failed:', e?.response?.body || e)
    return res.status(500).json({ ok: false, error: 'Failed to send email.' })
  }
})
