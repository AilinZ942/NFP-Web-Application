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



const MAPBOX_TOKEN = defineSecret("MAPBOX_TOKEN");

function parseLngLat(val) {
  const [lng, lat] = String(val || "").split(",").map(s => Number(s.trim()));
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return null;
  return [lng, lat];
}

function setCors(res, origin = "*") {
  res.set("Access-Control-Allow-Origin", origin);
  res.set("Access-Control-Allow-Headers", "content-type,authorization");
  res.set("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.set("Vary", "Origin");
}

exports.mbPlaces = onRequest({ cors: true, secrets: [MAPBOX_TOKEN] }, async (req, res) => {
  setCors(res, "*");
  if (req.method === "OPTIONS") return res.status(204).send("");
  if (req.method !== "GET") return res.status(405).send("Method Not Allowed");

  try {
    const token = MAPBOX_TOKEN.value();
    if (!token) return res.status(500).json({ ok: false, error: "Missing MAPBOX_TOKEN" });

    const q = (req.query.q || "hospital").toString().slice(0, 100);
    const center = parseLngLat(req.query.center) || [144.9631, -37.8136]; 
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);

    const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json`);
    url.searchParams.set("proximity", `${center[0]},${center[1]}`);
    url.searchParams.set("types", "poi");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("access_token", token);

    const r = await fetch(url);
    const json = await r.json();
    return res.json(json); 
  } catch (e) {
    console.error("MB_PLACES_ERROR:", e);
    return res.status(500).json({ ok: false, error: "Failed to fetch places" });
  }
});


exports.mbRoute = onRequest({ cors: true, secrets: [MAPBOX_TOKEN] }, async (req, res) => {
  setCors(res, "*");
  if (req.method === "OPTIONS") return res.status(204).send("");
  if (req.method !== "GET") return res.status(405).send("Method Not Allowed");

  try {
    const token = MAPBOX_TOKEN.value();
    if (!token) return res.status(500).json({ ok: false, error: "Missing MAPBOX_TOKEN" });

    const origin = parseLngLat(req.query.origin);
    const dest = parseLngLat(req.query.dest);
    if (!origin || !dest) return res.status(400).json({ ok: false, error: "Invalid origin/dest" });

    const profile = ["mapbox/driving", "mapbox/walking", "mapbox/cycling"].includes(req.query.profile)
      ? req.query.profile
      : "mapbox/driving";

    const url = new URL(`https://api.mapbox.com/directions/v5/${profile}/${origin[0]},${origin[1]};${dest[0]},${dest[1]}`);
    url.searchParams.set("alternatives", "true");
    url.searchParams.set("geometries", "geojson");
    url.searchParams.set("overview", "full");
    url.searchParams.set("steps", "true");
    url.searchParams.set("access_token", token);

    const r = await fetch(url);
    const json = await r.json();
    return res.json(json);
  } catch (e) {
    console.error("MB_ROUTE_ERROR:", e);
    return res.status(500).json({ ok: false, error: "Failed to fetch route" });
  }
});


