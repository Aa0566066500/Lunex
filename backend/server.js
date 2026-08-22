"use strict";

require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const { apiLimiter } = require("./rateLimit");

const app = express();
const PORT = process.env.PORT || 3000;

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

const apiKey = (process.env.AI_API_KEY || "").trim();

const ai = apiKey
  ? new GoogleGenAI({
      apiKey
    })
  : null;

function requireApiKey(req, res, next) {
  if (!ai) {
    return res.status(500).json({
      ok: false,
      error: "AI_API_KEY is not configured on the server."
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
    aiConfigured: Boolean(ai)
  });
});

/* =========================================================
   GEMINI AI
========================================================= */

async function askAI({
  message,
  history = [],
  instructions
}) {
  if (!ai) {
    throw new Error(
      "AI_API_KEY is not configured on the server."
    );
  }

  const contents = [];

  for (const item of history) {
    if (
      !item ||
      !["user", "assistant", "model"].includes(item.role)
    ) {
      continue;
    }

    if (
      typeof item.content !== "string" ||
      !item.content.trim()
    ) {
      continue;
    }

    contents.push({
      role:
        item.role === "assistant"
          ? "model"
          : "user",
      parts: [
        {
          text: item.content.slice(0, 20000)
        }
      ]
    });
  }

  contents.push({
    role: "user",
    parts: [
      {
        text: message.slice(0, 50000)
      }
    ]
  });

  const models = [
    process.env.AI_MODEL || "gemini-2.5-flash",
    "gemini-2.5-flash-lite"
  ];

  let lastError = null;

  for (const model of models) {
    try {
      console.log(`Trying Gemini model: ${model}`);

      const response = await ai.models.generateContent({
        model,
        contents,

        config: {
          systemInstruction:
            instructions ||
            "You are Lunex, a professional AI coding assistant.",

          maxOutputTokens:
            Number(process.env.AI_MAX_TOKENS) || 5000
        }
      });

      const text = response?.text;

      if (text && text.trim()) {
        console.log(`Gemini success: ${model}`);
        return text;
      }

      throw new Error(
        `Model ${model} returned an empty response.`
      );

    } catch (error) {
      lastError = error;

      const status =
        error?.status ||
        error?.code ||
        error?.response?.status;

      console.error(
        `Gemini model failed: ${model}`,
        status,
        error?.message || error
      );

      if (
        status === 503 ||
        status === 429 ||
        status === 500 ||
        status === "UNAVAILABLE"
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new Error(
    lastError?.message ||
    "جميع نماذج Gemini المتاحة مشغولة حاليًا. حاول مرة أخرى."
  );
}

/* =========================================================
   CHAT
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

        instructions: `
أنت Lunex، مساعد برمجة احترافي جدًا.

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
- Physics
- Performance
- Debugging
- Roblox Security
- Game Development

قواعدك:

1. افهم السؤال قبل الإجابة.
2. لا تخترع API غير موجودة.
3. عند كتابة Luau اجعله مناسبًا لـ Roblox Studio.
4. وضح مكان وضع الكود إذا كان ذلك مهمًا.
5. فرّق بين Script و LocalScript و ModuleScript.
6. انتبه لأمان RemoteEvents.
7. حلل الأخطاء بدل إعطاء حلول عشوائية.
8. إذا كان هناك حل أفضل، اقترحه.
9. لا تكشف أسرار الخادم أو API keys.
10. عندما يكتب المستخدم بالعربية، أجب بالعربية.
11. كن عمليًا ودقيقًا.
12. عند إعطاء كود، اجعله كاملًا وقابلًا للنسخ قدر الإمكان.
`
      });

      res.json({
        ok: true,
        reply
      });

    } catch (error) {
      console.error("CHAT ERROR:", error);

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

      const report = await askAI({
        message: `
افحص كود Luau التالي فحصًا احترافيًا ودقيقًا جدًا.

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

رتب الأخطاء من الأخطر إلى الأقل.

لكل خطأ استخدم:

1. المشكلة:
2. السطر:
3. الخطورة:
4. السبب:
5. الحل:

فرق بين الخطأ المؤكد والمشكلة المحتملة.

إذا لم تجد خطأ حقيقيًا، قل ذلك بوضوح.

الكود:

\`\`\`lua
${code.slice(0, 100000)}
\`\`\`
`,

        instructions: `
أنت Lunex Luau Code Analyzer.

أنت متخصص في Luau وRoblox Studio.

مهمتك اكتشاف الأخطاء الحقيقية وعدم اختراع أخطاء.

افحص:
Syntax
Runtime
Roblox API
Client/Server
Security
Performance
Logic
Memory

رتب النتائج بوضوح.
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
          error: "اكتب وصف التصميم أولًا."
        });
      }

      const design = await askAI({
        message: `
صمم واجهة احترافية بناءً على طلب المستخدم:

${request}

حدد:

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
- حالات الخطأ
- الجوال
- الكمبيوتر
- تجربة المستخدم

إذا كانت الواجهة لـ Roblox Studio،
اجعل التصميم مناسبًا لـ Roblox UI.

ركز على تصميم نظيف وحديث واحترافي.
`,

        instructions: `
أنت Lunex UI Designer.

متخصص في:
- Web UI
- Mobile UI
- Roblox UI
- UX
- Design Systems

اجعل التصميم عمليًا وحديثًا وسهل الاستخدام.
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

const frontendPath = path.join(
  __dirname,
  "..",
  "frontend"
);

app.use(
  express.static(frontendPath)
);

app.use((req, res, next) => {
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
});

/* =========================================================
   404
========================================================= */

app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      ok: false,
      error: "API endpoint not found."
    });
  }

  res.status(404).send(
    "Lunex page not found."
  );
});

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
      `Gemini configured: ${Boolean(ai)}`
    );
  }
);