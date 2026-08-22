"use strict";

require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const { apiLimiter } = require("./rateLimit");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.disable("x-powered-by");

/* =========================================================
   CONFIG
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
   GEMINI
========================================================= */

const apiKey =
  String(process.env.AI_API_KEY || "").trim();

const MODEL =
  String(
    process.env.AI_MODEL ||
      "gemini-3.6-flash"
  ).trim();

const ai = apiKey
  ? new GoogleGenAI({
      apiKey
    })
  : null;

/* =========================================================
   API KEY CHECK
========================================================= */

function requireApiKey(req, res, next) {
  if (!ai) {
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
    aiConfigured: Boolean(ai),
    model: MODEL
  });
});

/* =========================================================
   CLEAN HISTORY
========================================================= */

function cleanHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter((item) => {
      return (
        item &&
        typeof item.content === "string" &&
        item.content.trim() &&
        ["user", "assistant", "model"].includes(
          item.role
        )
      );
    })
    .slice(-30)
    .map((item) => ({
      role:
        item.role === "assistant"
          ? "model"
          : "user",

      parts: [
        {
          text: item.content.slice(0, 20000)
        }
      ]
    }));
}

/* =========================================================
   ASK GEMINI
========================================================= */

async function askAI({
  message,
  history = [],
  instructions = ""
}) {
  if (!ai) {
    throw new Error(
      "AI_API_KEY is not configured on the server."
    );
  }

  const contents = cleanHistory(history);

  contents.push({
    role: "user",

    parts: [
      {
        text: String(message).slice(0, 100000)
      }
    ]
  });

  const response =
    await ai.models.generateContent({
      model: MODEL,

      contents,

      config: {
        systemInstruction:
          instructions ||
          "You are Lunex, a professional AI assistant.",

        temperature: 0.2,

        maxOutputTokens:
          Number(
            process.env.AI_MAX_TOKENS
          ) || 8000
      }
    });

  const text =
    typeof response?.text === "string"
      ? response.text
      : "";

  if (!text.trim()) {
    throw new Error(
      "Gemini returned an empty response."
    );
  }

  return text;
}

/* =========================================================
   LUNEX SYSTEM PROMPT
========================================================= */

const LUNEX_INSTRUCTIONS = `
أنت Lunex، مساعد برمجة احترافي.

تخصصك الأساسي:

- Roblox Studio
- Luau
- Lua
- Roblox APIs
- Scripts
- LocalScripts
- ModuleScripts
- RemoteEvents
- RemoteFunctions
- Client / Server
- DataStore
- MemoryStore
- MessagingService
- TweenService
- RunService
- UserInputService
- ContextActionService
- Roblox UI
- GUI
- Physics
- Performance
- Debugging
- Security
- Game Development

قواعد مهمة:

1. افهم طلب المستخدم قبل الإجابة.
2. لا تخترع Roblox APIs.
3. إذا كان السؤال عن Luau، اكتب Luau صالحًا لـ Roblox Studio.
4. وضح أين يوضع الكود عند الحاجة.
5. فرّق بوضوح بين Script و LocalScript و ModuleScript.
6. اهتم بأمان السيرفر وRemoteEvents.
7. لا تثق بمدخلات العميل.
8. لا تكشف API keys أو أسرار الخادم.
9. إذا أعطاك المستخدم خطأ، حلله بدل التخمين.
10. إذا كان هناك أكثر من حل، اختر الأفضل واشرح السبب.
11. عندما يطلب المستخدم كودًا، اجعله كاملًا وقابلًا للنسخ.
12. استخدم Markdown عند الحاجة.
13. ضع الأكواد داخل code blocks مثل:

\`\`\`lua
-- code
\`\`\`

14. لا تكتب الكود خارج code blocks إذا كان المقصود نسخه.
15. إذا كان المستخدم يتحدث بالعربية، أجب بالعربية.
16. لا تقل إنك نفذت شيئًا فعليًا إذا لم تنفذه.
17. كن واضحًا ومباشرًا واحترافيًا.
`;

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

      const reply = await askAI({
        message,
        history,
        instructions:
          LUNEX_INSTRUCTIONS
      });

      return res.json({
        ok: true,
        reply
      });

    } catch (error) {
      console.error(
        "CHAT ERROR:",
        error
      );

      return res.status(500).json({
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

      const prompt = `
افحص كود Luau التالي فحصًا احترافيًا.

ابحث عن:

- Syntax errors
- Runtime errors
- nil references
- أخطاء المتغيرات
- أخطاء scope
- Roblox API errors
- Client / Server mistakes
- RemoteEvent security
- RemoteFunction security
- loops
- connections
- memory leaks
- performance problems
- deprecated APIs
- typing problems
- logical bugs

مهم جدًا:

لا تخترع أخطاء.

فرّق بين:
- خطأ مؤكد
- مشكلة محتملة
- تحسين مقترح

رتب النتائج من الأخطر إلى الأقل.

لكل خطأ استخدم هذا الشكل:

[1]
المشكلة:
السطر:
الخطورة:
السبب:
الحل:

[2]
المشكلة:
السطر:
الخطورة:
السبب:
الحل:

إذا لم تجد أخطاء حقيقية، اكتب:

لم يتم العثور على أخطاء مؤكدة.

ثم اذكر تحسينات اختيارية إن وجدت.

الكود:

\`\`\`lua
${code.slice(0, 100000)}
\`\`\`
`;

      const report = await askAI({
        message: prompt,

        instructions: `
أنت Lunex Luau Analyzer.

وظيفتك تحليل كود Luau وRoblox Studio.

كن دقيقًا جدًا.

ممنوع اختراع:
- APIs
- أخطاء
- أرقام أسطر غير مؤكدة

إذا لم تستطع التأكد من شيء، قل إنه محتمل.

ركز على:
Syntax
Runtime
Roblox API
Client/Server
Security
Performance
Logic
Memory
`
      });

      return res.json({
        ok: true,
        report
      });

    } catch (error) {
      console.error(
        "ANALYZER ERROR:",
        error
      );

      return res.status(500).json({
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

أعطني تصورًا منظمًا يشمل:

- Layout
- ترتيب العناصر
- الأزرار
- الأيقونات
- الأحجام
- المسافات
- الألوان
- الخطوط
- Hover
- Active
- Disabled
- حالات الخطأ
- الجوال
- الكمبيوتر
- تجربة المستخدم
- Responsive behavior

إذا كانت الواجهة لـ Roblox Studio،
اجعلها مناسبة لـ Roblox UI.

ركز على تصميم حديث ونظيف واحترافي.
`,

          instructions: `
أنت Lunex UI Designer.

متخصص في:

- Web UI
- Mobile UI
- Roblox UI
- UX
- Design Systems

صمم أفكارًا عملية وقابلة للتنفيذ.
`
        });

      return res.json({
        ok: true,
        design
      });

    } catch (error) {
      console.error(
        "UI DESIGN ERROR:",
        error
      );

      return res.status(500).json({
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

/* =========================================================
   SPA FALLBACK
========================================================= */

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
   API 404
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

    return res.status(404).send(
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

    return res.status(500).json({
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
      `Gemini configured: ${Boolean(ai)}`
    );

    console.log(
      `Gemini model: ${MODEL}`
    );
  }
);