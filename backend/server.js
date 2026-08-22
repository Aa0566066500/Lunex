"use strict";

require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const { apiLimiter } = require("./rateLimit");

const app = express();

const PORT = process.env.PORT || 3000;

app.disable("x-powered-by");

/* =========================================================
   BASIC CONFIG
========================================================= */

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
   RATE LIMIT
========================================================= */

app.use("/api", apiLimiter);

/* =========================================================
   OPENAI
========================================================= */

const apiKey =
  (process.env.AI_API_KEY || "").trim();

const openai = apiKey
  ? new OpenAI({
      apiKey
    })
  : null;

function requireApiKey(req, res, next) {

  if (!openai) {
    return res.status(500).json({
      ok: false,
      error:
        "AI_API_KEY is not configured on the server."
    });
  }

  next();
}

/* =========================================================
   HEALTH
========================================================= */

app.get("/api/health", (req, res) => {

  res.json({
    ok: true,
    name: "Lunex",
    status: "online",
    aiConfigured: Boolean(openai)
  });

});

/* =========================================================
   AI FUNCTION
========================================================= */

async function askAI({
  message,
  history = [],
  instructions
}) {

  if (!openai) {
    throw new Error(
      "AI_API_KEY is not configured on the server."
    );
  }

  const input = [];

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

    input.push({
      role: item.role,
      content: item.content.slice(0, 20000)
    });

  }

  input.push({
    role: "user",
    content: message.slice(0, 50000)
  });

  const response =
    await openai.responses.create({

      model:
        process.env.AI_MODEL ||
        "gpt-5.6",

      instructions:
        instructions ||
        `
أنت Lunex، مساعد ذكاء اصطناعي احترافي.

كن دقيقًا ومباشرًا.
إذا كان السؤال برمجيًا، أعطِ حلًا عمليًا.
إذا كان هناك كود، حلله قبل اقتراح التعديل.
        `,

      input,

      max_output_tokens:
        Number(
          process.env.AI_MAX_TOKENS
        ) || 5000

    });

  return (
    response.output_text ||
    "لم يرجع الذكاء الاصطناعي نتيجة."
  );
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

          instructions: `
أنت Lunex، مساعد برمجة احترافي.

تخصصك الأساسي:

- Roblox Studio
- Luau
- Lua
- Roblox APIs
- RemoteEvents
- RemoteFunctions
- Client/Server
- ModuleScripts
- DataStore
- MemoryStore
- MessagingService
- TweenService
- RunService
- UI
- الفيزياء
- الأداء
- Debugging
- أمن ألعاب Roblox
- هندسة المشاريع

عند التعامل مع Luau:

1. افهم المشكلة أولًا.
2. لا تخترع API.
3. اكتب كودًا صالحًا لـ Roblox Studio.
4. وضح مكان وضع السكربت.
5. انتبه للفرق بين LocalScript و Script و ModuleScript.
6. انتبه لأمان RemoteEvents.
7. إذا كان هناك خطأ، اشرح سببه.
8. إذا كان هناك حل أفضل، اقترحه.
9. لا تعرض أسرار السيرفر أو مفاتيح API.
10. عندما يكتب المستخدم بالعربية، أجب بالعربية.

اجعل إجاباتك عملية وليست عامة.
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
          error?.message ||
          "تعذر إكمال الطلب."
      });

    }

  }
);

/* =========================================================
   LUAU ANALYZER
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
افحص كود Luau التالي فحصًا احترافيًا.

ابحث عن:

- Syntax errors
- Runtime errors
- nil references
- أخطاء المتغيرات
- أخطاء scope
- أخطاء Roblox API
- Client/Server mistakes
- RemoteEvent security
- RemoteFunction security
- loops
- connections
- memory leaks
- performance problems
- deprecated APIs
- typing problems
- logical bugs
- أخطاء واضحة في ترتيب التنفيذ

رتب المشاكل من الأخطر إلى الأقل.

لكل مشكلة استخدم هذا الشكل:

1. المشكلة:
السطر:
الخطورة:
السبب:
الحل:

إذا لم تجد خطأ مؤكدًا، لا تخترع خطأ.

الكود:

\`\`\`lua
${code.slice(0, 100000)}
\`\`\`
`,

          instructions: `
أنت Lunex Luau Analyzer.

مهمتك تحليل Luau وRoblox Studio بدقة شديدة.

لا تخترع أخطاء.
فرق بين:
- خطأ مؤكد
- مشكلة محتملة
- تحسين اختياري

ركز على المشاكل التي يمكن أن تسبب فشل السكربت أو مشاكل أمان أو أداء.
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
          error?.message ||
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
          error:
            "اكتب وصف التصميم أولًا."
        });

      }

      const design =
        await askAI({

          message: `
صمم واجهة احترافية بناءً على طلب المستخدم:

${request}

قدم:

- Layout
- ترتيب العناصر
- الأزرار
- الأيقونات
- الأحجام
- المسافات
- الألوان
- الخطوط
- الحالات التفاعلية
- الجوال
- الكمبيوتر
- تجربة المستخدم

إذا كان التصميم لـ Roblox Studio،
اجعله مناسبًا لـ Roblox UI.

لا تستخدم ملصقات أو عناصر عشوائية.
اجعل التصميم نظيفًا وحديثًا.
`,

          instructions: `
أنت Lunex UI Designer.

متخصص في:
- Web UI
- Mobile UI
- Roblox UI
- UX
- Design systems

ركز على التصميم العملي والاحترافي.
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
          error?.message ||
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
 * لا تستخدم:
 *
 * app.get("*")
 *
 * لأن Express 5 قد يرفض هذا المسار.
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
        error:
          "API endpoint not found."
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
  (error, req, res, next) => {

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
      `OpenAI configured: ${Boolean(openai)}`
    );

  }
);