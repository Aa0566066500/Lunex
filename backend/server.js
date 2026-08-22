"use strict";

const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

const FRONTEND_DIR = path.join(__dirname, "..", "frontend");

/* =========================================================
   SECURITY / LIMITS
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
   HEALTH CHECK
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

app.post("/api/chat", async (req, res) => {

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

    /*
      هنا سنضع اتصال مزود الذكاء الاصطناعي لاحقًا.

      مهم:
      لا تضع API key هنا بشكل مباشر.

      استخدم:
        process.env.AI_API_KEY

      والمفتاح نفسه يكون محفوظًا في
      Render Environment Variables.
    */

    return res.json({
      reply:
        "Lunex جاهز. اتصال الذكاء الاصطناعي سيتم تفعيله في الخطوة التالية."
    });

  } catch (error) {

    console.error("[LUNEX API ERROR]", error);

    return res.status(500).json({
      error: "حدث خطأ داخلي في الخادم."
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
    path.join(FRONTEND_DIR, "index.html")
  );

});

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use((err, req, res, next) => {

  console.error("[LUNEX SERVER ERROR]", err);

  res.status(500).json({
    error: "حدث خطأ غير متوقع."
  });

});

/* =========================================================
   START
========================================================= */

app.listen(PORT, "0.0.0.0", () => {

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("        LUNEX ENGINE");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Server: http://0.0.0.0:${PORT}`);
  console.log("Status: ONLINE");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");

});