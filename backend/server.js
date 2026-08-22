"use strict";

const express = require("express");
const path = require("path");

const rateLimit = require("./rateLimit");
const { askAI } = require("./ai");

const app = express();

const PORT = process.env.PORT || 3000;
const FRONTEND_DIR = path.join(__dirname, "..", "frontend");

/* =========================================================
   SECURITY
========================================================= */

app.disable("x-powered-by");

app.use(express.json({
  limit: "1mb"
}));

app.use(express.urlencoded({
  extended: false,
  limit: "1mb"
}));

/* =========================================================
   FRONTEND
========================================================= */

app.use(
  express.static(FRONTEND_DIR, {
    extensions: ["html"],
    maxAge: "1h"
  })
);

/* =========================================================
   HEALTH
========================================================= */

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    name: "Lunex",
    service: "AI Engineering Studio"
  });
});

/* =========================================================
   CHAT
========================================================= */

app.post("/api/chat", rateLimit, async (req, res) => {

  try {

    const message =
      typeof req.body?.message === "string"
        ? req.body.message.trim()
        : "";

    if (!message) {
      return res.status(400).json({
        error: "اكتب رسالة أولًا."
      });
    }

    if (message.length > 20000) {
      return res.status(413).json({
        error: "الرسالة طويلة جدًا."
      });
    }

    const history =
      Array.isArray(req.body?.history)
        ? req.body.history
        : [];

    const reply = await askAI(
      message,
      history
    );

    return res.json({
      ok: true,
      reply
    });

  } catch (error) {

    console.error(
      "[LUNEX CHAT ERROR]",
      error
    );

    return res.status(500).json({
      ok: false,
      error:
        error?.message ||
        "حدث خطأ أثناء معالجة الطلب."
    });

  }

});

/* =========================================================
   SPA FALLBACK
========================================================= */

app.get("*", (req, res, next) => {

  if (req.path.startsWith("/api/")) {
    return next();
  }

  res.sendFile(
    path.join(
      FRONTEND_DIR,
      "index.html"
    )
  );

});

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use((err, req, res, next) => {

  console.error(
    "[LUNEX SERVER ERROR]",
    err
  );

  res.status(500).json({
    ok: false,
    error: "حدث خطأ غير متوقع."
  });

});

/* =========================================================
   START
========================================================= */

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log("");
    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );
    console.log(
      "          LUNEX ENGINE"
    );
    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );
    console.log(
      `Server running on port ${PORT}`
    );
    console.log(
      "AI engine: CONNECTED"
    );
    console.log(
      "Security: ENABLED"
    );
    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );
    console.log("");

  }
);