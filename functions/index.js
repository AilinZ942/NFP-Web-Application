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


/* eslint-env node */
/* global fetch, URL */
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

  try {
    const token = MAPBOX_TOKEN.value();
    if (!token) return res.status(500).json({ error: "Missing MAPBOX_TOKEN" });
    const qRaw = String(req.query.q || "").toLowerCase().trim();
    let queryText;
    if (qRaw.includes("police")) {
      queryText = "police station";
    } else if (qRaw.includes("hospital")) {
      queryText = "hospital";
    } else {
      queryText = qRaw || "hospital";
  }

    let [lng, lat] = String(req.query.center || "144.9631,-37.8136").split(",").map(Number);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) { lng = 144.9631; lat = -37.8136; }
    if (Math.abs(lng) > 180 || Math.abs(lat) > 90) { [lng, lat] = [lat, lng]; }
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 50);


    const makeUrl = (withTypes) => {
      const u = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(queryText)}.json`);
      u.searchParams.set("access_token", token);
      u.searchParams.set("proximity", `${lng},${lat}`);       
      u.searchParams.set("limit", String(limit));
      u.searchParams.set("language", "en");
      if (withTypes) u.searchParams.set("types", "poi");

      const bboxStr = String(req.query.bbox || "").trim();
      const box = bboxStr.split(",").map(Number);
      if (box.length === 4 && box.every(Number.isFinite)) {
        u.searchParams.set("bbox", box.join(","));
      }
      const country = String(req.query.country || "").trim().toLowerCase();
      if (country) u.searchParams.set("country", country);
      
      if (queryText === "hospital") u.searchParams.set("categories", "hospital");
      if (queryText === "police station") u.searchParams.set("categories", "police");

      return u;
    };
    let r = await fetch(makeUrl(true));
    let text = await r.text();

    if (r.ok) {
      try {
        const json = JSON.parse(text);
        const count = Array.isArray(json.features) ? json.features.length : 0;
        if (count === 0) {
          const r2 = await fetch(makeUrl(false));
          const text2 = await r2.text();
          if (!r2.ok) return res.status(r2.status).send(text2);
          return res.type("application/json").send(text2);
        }
      } catch (e) { 
        console.error(e); }
    }

    if (!r.ok) return res.status(r.status).send(text);
    return res.type("application/json").send(text);
  } catch (e) {
    console.error("mbPlaces error", e);
    return res.status(500).json({ error: "mbPlaces failed" });
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


const admin = require("firebase-admin");
admin.initializeApp();

const AGE_ENUM = new Set([
  "16-25", "26-35", "36-45", "46-55", "56-65", "65+", "notSay",
]);

const TOPIC_ENUM = new Set([
  "Adolescent Health",
  "Pregnancy & Postpartum",
  "Mental Health",
  "Nutrition & Physical Activity",
  "Chronic Disease",
  "Menopause",
]);

exports.updateUserProfile = onRequest(async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });

  try {
    const authHeader = req.headers.authorization || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!idToken) return res.status(401).json({ error: "UNAUTHENTICATED" });

    const decoded = await admin.auth().verifyIdToken(idToken);
    const callerUid = decoded.uid;

    const { username, country, city, age, interestTopic } = req.body || {};

    const patch = {};

    if (typeof username === "string") {
      const v = username.trim();
      if (v.length < 3) return res.status(400).json({ error: "INVALID_ARGUMENT", field: "username" });
      patch.username = v.slice(0, 60);
    }

    if (typeof country === "string") {
      patch.country = country.trim().slice(0, 60);
    }

    if (typeof city === "string") {
      patch.city = city.trim().slice(0, 60);
    }

    if (typeof age === "string") {
      const a = age.trim();
      if (!AGE_ENUM.has(a)) return res.status(400).json({ error: "INVALID_ARGUMENT", field: "age" });
      patch.age = a;
      patch.ageBand = a;
    }

    if (typeof interestTopic === "string") {
      const t = interestTopic.trim();
      if (!TOPIC_ENUM.has(t)) return res.status(400).json({ error: "INVALID_ARGUMENT", field: "interestTopic" });
      patch.interestTopic = t;
    }

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: "INVALID_ARGUMENT", message: "no valid fields" });
    }

    patch.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    const userRef = admin.firestore().doc(`users/${callerUid}`);
    await userRef.set(patch, { merge: true });

    const snap = await userRef.get();
    return res.json({ ok: true, data: snap.data() });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "INTERNAL", message: e.message || String(e) });
  }
});


const db = admin.firestore();

const toKey = (s) => String(s || "").trim().toLowerCase();

exports.checkNameUnique = onRequest(async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });

  try {
    const raw = req.body?.username;
    const name = toKey(raw);
    if (name.length < 3 || name.length > 60) {
      return res.json({ ok: true, unique: false, reason: "length" });
    }
    const snap = await db.collection("users")
      .where("username", "==", name)
      .limit(1)
      .get();

    return res.json({ ok: true, unique: snap.empty }); 
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "INTERNAL", message: e.message || String(e) });
  }
});


