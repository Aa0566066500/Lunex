"use strict";

const express = require("express");
const path = require("path");

const rateLimit = require("./rateLimit");
const { askAI } = require("./ai");

const app = express();

const PORT = process.env.PORT || 3000;
const FRONTEND_DIR = path.join(__dirname, "..", "frontend");

app.disable("x-powered-by");

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({
  extended: false,
  limit: "2mb"
}));

app.use(express.static(FRONTEND_DIR, {
  maxAge: "1h"
}));

/* =========================
   HEALTH
========================= */

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    name: "Lunex",
    version: "1.0.0"
  });
});

/* =========================
   AI CHAT
========================= */

app.post("/api/chat", rateLimit, async (req, res) => {

  try {

    const message =
      typeof req.body?.message === "string"
        ? req.body.message.trim()
        : "";

    if (!message) {
      return res.status(400).json({
        ok: false,
        error: "اكتب رسالة أولًا."
      });
    }

    if (message.length > 20000) {
      return res.status(413).json({
        ok: false,
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

    res.json({
      ok: true,
      reply
    });

  } catch (error) {

    console.error(
      "[LUNEX CHAT ERROR]",
      error
    );

    res.status(500).json({
      ok: false,
      error:
        error?.message ||
        "تعذر إكمال الطلب."
    });
  }
});

/* =========================
   CODE ANALYZER
========================= */

app.post("/api/analyze", rateLimit, async (req, res) => {

  try {

    const code =
      typeof req.body?.code === "string"
        ? req.body.code
        : "";

    if (!code.trim()) {
      return res.status(400).json({
        ok: false,
        error: "لا يوجد كود للفحص."
      });
    }

    if (code.length > 50000) {
      return res.status(413).json({
        ok: false,
        error: "حجم الكود كبير جدًا."
      });
    }

    const prompt = `
Analyze the following Roblox Luau code.

This is a static code review, not actual execution.

Return a structured report with:

- errors
- warnings
- suggestions
- security issues
- performance issues

For every issue provide:
- severity
- line number when reasonably identifiable
- title
- explanation
- suggested fix

Do not invent an error if the code appears valid.

CODE:

\`\`\`lua
${code}
\`\`\`
`;

    const reply = await askAI(prompt);

    res.json({
      ok: true,
      report: reply
    });

  } catch (error) {

    console.error(
      "[LUNEX ANALYZER ERROR]",
      error
    );

    res.status(500).json({
      ok: false,
      error:
        error?.message ||
        "تعذر فحص الكود."
    });
  }
});

/* =========================
   UI DESIGNER
========================= */

app.post("/api/ui-design", rateLimit, async (req, res) => {

  try {

    const request =
      typeof req.body?.request === "string"
        ? req.body.request.trim()
        : "";

    if (!request) {
      return res.status(400).json({
        ok: false,
        error: "اكتب وصف الواجهة."
      });
    }

    const prompt = `
You are Lunex UI Designer.

The user wants a Roblox UI design.

Create a professional UI specification based on
the request below.

Decide intelligently:
- hierarchy
- layout
- spacing
- buttons
- labels
- panels
- navigation
- colors
- typography
- responsive behavior

If the user specifies a design, follow it.
If they don't, create a polished original design.

User request:

${request}

Return:
1. Design concept
2. Layout
3. Components
4. Exact labels
5. Interaction behavior
6. Roblox Studio implementation plan
`;

    const reply = await askAI(prompt);

    res.json({
      ok: true,
      design: reply
    });

  } catch (error) {

    console.error(
      "[LUNEX UI ERROR]",
      error
    );

    res.status(500).json({
      ok: false,
      error:
        error?.message ||
        "تعذر إنشاء تصميم الواجهة."
    });
  }
});

/* =========================
   SPA FALLBACK
========================= */

app.use((req, res, next) => {

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

/* =========================
   ERROR HANDLER
========================= */

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

/* =========================
   START
========================= */

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );

    console.log(
      "        LUNEX ENGINE"
    );

    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );

    console.log(
      `Server running on port ${PORT}`
    );

    console.log(
      "AI API: READY"
    );

    console.log(
      "Analyzer: READY"
    );

    console.log(
      "UI Designer: READY"
    );

    console.log(
      "Security: ENABLED"
    );

    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );
  }
);