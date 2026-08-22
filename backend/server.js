"use strict";

require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

const { apiLimiter } = require("./rateLimit");

const app = express();

const PORT = process.env.PORT || 3000;

/* =========================================================
   BASIC CONFIG
========================================================= */

app.disable("x-powered-by");

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(
  express.json({
    limit: "5mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "5mb"
  })
);

/* =========================================================
   API RATE LIMIT
========================================================= */

app.use("/api", apiLimiter);

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    name: "Lunex",
    status: "online"
  });
});

/* =========================================================
   API KEY CHECK
========================================================= */

function getApiKey() {
  return (
    process.env.AI_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    ""
  ).trim();
}

function requireApiKey(req, res, next) {
  if (!getApiKey()) {
    return res.status(500).json({
      ok: false,
      error:
        "AI_API_KEY is not configured on the server."
    });
  }

  next();
}

/* =========================================================
   AI REQUEST
========================================================= */

async function askAI({
  message,
  history = [],
  system
}) {

  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error(
      "AI_API_KEY is not configured on the server."
    );
  }

  /*
   * استخدم Anthropic مباشرة من السيرفر.
   * المفتاح لا يصل أبدًا للمتصفح.
   */

  const messages = [];

  for (const item of history) {

    if (
      !item ||
      !["user", "assistant"].includes(
        item.role
      )
    ) {
      continue;
    }

    if (
      typeof item.content !== "string" ||
      !item.content.trim()
    ) {
      continue;
    }

    messages.push({
      role: item.role,
      content: item.content.slice(0, 20000)
    });
  }

  messages.push({
    role: "user",
    content: message.slice(0, 30000)
  });

  const response = await fetch(
    "https://api.anthropic.com/v1/messages",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        "x-api-key": apiKey,

        "anthropic-version":
          "2023-06-01"
      },

      body: JSON.stringify({
        model:
          process.env.AI_MODEL ||
          "claude-sonnet-4-20250514",

        max_tokens:
          Number(
            process.env.AI_MAX_TOKENS
          ) || 4096,

        system:
          system ||
          "You are Lunex, an expert AI coding assistant.",

        messages
      })
    }
  );

  const data =
    await response.json();

  if (!response.ok) {

    console.error(
      "AI provider error:",
      data
    );

    throw new Error(
      data?.error?.message ||
      "AI provider request failed."
    );
  }

  const text =
    Array.isArray(data.content)
      ? data.content
          .filter(
            (block) =>
              block.type === "text"
          )
          .map(
            (block) =>
              block.text
          )
          .join("\n")
      : "";

  return text || "لم يرجع الذكاء الاصطناعي نصًا.";
}

/* =========================================================
   GENERAL CHAT
========================================================= */

app.post(
  "/api/chat",
  requireApiKey,
  async (req, res) => {

    try {

      const message =
        typeof req.body?.message === "string"
          ? req.body.message.trim()
          : "";

      const history =
        Array.isArray(req.body?.history)
          ? req.body.history
          : [];

      if (!message) {

        return res.status(400).json({
          ok: false,
          error: "الرسالة فارغة."
        });
      }

      const reply =
        await askAI({
          message,
          history,

          system: `
أنت Lunex، مساعد ذكاء اصطناعي احترافي.

أنت متخصص جدًا في:
- Roblox Studio
- Luau
- Lua
- Roblox APIs
- RemoteEvents و RemoteFunctions
- Client/Server architecture
- UI
- ModuleScripts
- DataStore
- MemoryStore
- MessagingService
- TweenService
- RunService
- Physics
- Security
- تحسين الأداء
- Debugging
- Game development

عند سؤال المستخدم عن البرمجة:
1. افهم المشكلة أولًا.
2. أعطِ حلًا عمليًا.
3. إذا كان هناك كود، صححه واشرح الخطأ.
4. لا تخترع API غير موجودة.
5. إذا كان هناك أكثر من حل، اختر الأفضل واذكر البدائل باختصار.
6. اجعل أمثلة Luau متوافقة مع Roblox Studio.
7. لا تكشف مفاتيح API أو أسرار الخادم.
8. اكتب بالعربية عندما يكتب المستخدم بالعربية.

كن دقيقًا ومباشرًا.
`
        });

      res.json({
        ok: true,
        reply
      });

    } catch (error) {

      console.error(
        "CHAT ERROR:",
        error
      );

      res.status(500).json({
        ok: false,
        error:
          error.message ||
          "تعذر إكمال الطلب."
      });
    }
  }
);

/* =========================================================
   LUAU CODE ANALYZER
========================================================= */

app.post(
  "/api/analyze",
  requireApiKey,
  async (req, res) => {

    try {

      const code =
        typeof req.body?.code === "string"
          ? req.body.code
          : "";

      if (!code.trim()) {

        return res.status(400).json({
          ok: false,
          error: "لم يتم إرسال كود."
        });
      }

      const report =
        await askAI({

          message: `
افحص كود Luau التالي فحصًا دقيقًا جدًا:

ابدأ بتحليل:
- Syntax
- Runtime errors المحتملة
- أخطاء Roblox API
- أخطاء Client/Server
- RemoteEvent security
- المتغيرات غير الصحيحة
- nil references
- مشاكل scope
- loops
- connections
- memory leaks
- performance
- deprecated APIs
- أخطاء typing إن وجدت
- أخطاء منطقية واضحة

رتب النتائج من الأخطر إلى الأقل خطورة.

لكل مشكلة حاول كتابة:
رقم المشكلة
السطر إن أمكن
نوع المشكلة
سبب المشكلة
طريقة إصلاحها

إذا لم تجد أخطاء حقيقية، قل ذلك بوضوح.

لا تغيّر الكود.
لا تختصر المشاكل المهمة.

الكود:

\`\`\`lua
${code.slice(0, 100000)}
\`\`\`
`,

          system: `
أنت Lunex Code Analyzer.

أنت محلل متخصص في Luau وRoblox Studio.
مهمتك تحليل الكود بدقة وليس تأليف أخطاء غير موجودة.

إذا لم تكن متأكدًا من مشكلة، وضح أنها احتمالية بدل اعتبارها خطأ مؤكدًا.
`
        });

      res.json({
        ok: true,
        report
      });

    } catch (error) {

      console.error(
        "ANALYZER ERROR:",
        error
      );

      res.status(500).json({
        ok: false,
        error:
          error.message ||
          "تعذر فحص الكود."
      });
    }
  }
);

/* =========================================================
   UI DESIGNER
========================================================= */

app.post(
  "/api/ui-design",
  requireApiKey,
  async (req, res) => {

    try {

      const request =
        typeof req.body?.request === "string"
          ? req.body.request.trim()
          : "";

      if (!request) {

        return res.status(400).json({
          ok: false,
          error: "اكتب وصف التصميم أولًا."
        });
      }

      const design =
        await askAI({

          message: `
المستخدم يريد تصميم واجهة.

طلب المستخدم:

${request}

أنشئ له تصورًا احترافيًا للواجهة.

حدد:
- Layout
- الأزرار
- الألوان
- الأحجام
- ترتيب العناصر
- التفاعل
- حالات Hover/Active
- الجوال
- الكمبيوتر

إذا كان التصميم مخصصًا لـ Roblox Studio، اجعل المقترحات مناسبة لـ Roblox UI.

لا تستخدم صورًا أو ملصقات بشكل عشوائي.
ركز على واجهة نظيفة واحترافية.
`,

          system: `
أنت Lunex UI Designer.

أنت متخصص في تصميم واجهات التطبيقات والألعاب.
اجعل التصاميم حديثة وبسيطة وعملية.
`
        });

      res.json({
        ok: true,
        design
      });

    } catch (error) {

      console.error(
        "UI DESIGN ERROR:",
        error
      );

      res.status(500).json({
        ok: false,
        error:
          error.message ||
          "تعذر إنشاء التصميم."
      });
    }
  }
);

/* =========================================================
   FRONTEND
========================================================= */

const frontendPath =
  path.join(
    __dirname,
    "..",
    "frontend"
  );

app.use(
  express.static(frontendPath)
);

/*
 * مهم:
 * لا نستخدم app.get("*")
 * لأن إصدارات Express الحديثة
 * قد ترفض هذا المسار.
 */

app.use(
  (req, res, next) => {

    if (
      req.method !== "GET" ||
      req.path.startsWith("/api/")
    ) {
      return next();
    }

    res.sendFile(
      path.join(
        frontendPath,
        "index.html"
      )
    );
  }
);

/* =========================================================
   404
========================================================= */

app.use(
  (req, res) => {

    if (
      req.path.startsWith("/api/")
    ) {

      return res.status(404).json({
        ok: false,
        error: "API endpoint not found."
      });
    }

    res.status(404).send(
      "Lunex page not found."
    );
  }
);

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use(
  (
    error,
    req,
    res,
    next
  ) => {

    console.error(
      "SERVER ERROR:",
      error
    );

    if (res.headersSent) {
      return next(error);
    }

    res.status(500).json({
      ok: false,
      error:
        "Internal server error."
    });
  }
);

/* =========================================================
   START
========================================================= */

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `Lunex server running on port ${PORT}`
    );

    console.log(
      `AI key configured: ${
        Boolean(getApiKey())
      }`
    );
  }
);