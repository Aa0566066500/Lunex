"use strict";

const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();

const PORT = process.env.PORT || 3000;
const FRONTEND_DIR = path.join(__dirname, "../frontend");

/* =========================
   Security
========================= */

app.disable("x-powered-by");

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
  })
);

app.use(
  express.json({
    limit: "1mb"
  })
);

/* =========================
   Rate Limit
========================= */

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "طلبات كثيرة. حاول مرة ثانية بعد قليل."
  }
});

/* =========================
   Health Check
========================= */

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    name: "Lunex",
    service: "AI Engineering Studio"
  });
});

/* =========================
   AI Endpoint
========================= */

app.post("/api/chat", apiLimiter, async (req, res) => {
  try {
    const message =
      typeof req.body?.message === "string"
        ? req.body.message.trim()
        : "";

    if (!message) {
      return res.status(400).json({
        error: "اكتب رسالتك أولًا."
      });
    }

    if (message.length > 20000) {
      return res.status(413).json({
        error: "الرسالة طويلة جدًا."
      });
    }

    /*
      لاحقًا هنا نربط AI Engine الحقيقي.
      API Key لن يكون في GitHub.
      سيكون Environment Variable في Render.
    */

    return res.json({
      ok: true,
      reply:
        "Lunex جاهز. محرك الذكاء الاصطناعي سيتم ربطه في المرحلة التالية."
    });
  } catch (error) {
    console.error("CHAT_ERROR:", error);

    return res.status(500).json({
      error: "حدث خطأ داخلي في الخادم."
    });
  }
});

/* =========================
   Static Frontend
========================= */

app.use(express.static(FRONTEND_DIR));

/* =========================
   Frontend Fallback
========================= */

app.get("*", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

/* =========================
   Start
========================= */

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Lunex running on port ${PORT}`);
});