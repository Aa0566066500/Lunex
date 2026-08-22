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

app.use("/api", apiLimiter);

/* =========================================================
   GEMINI
========================================================= */

const apiKey = (
  process.env.AI_API_KEY || ""
).trim();

const ai = apiKey
  ? new GoogleGenAI({
      apiKey
    })
  : null;

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
   MODEL
========================================================= */

const MODEL =
  process.env.AI_MODEL ||
  "gemini-3.6-flash";

/* =========================================================
   LUNEX SYSTEM PROMPT
========================================================= */

const LUNEX_INSTRUCTIONS = `
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

القواعد:

1. افهم السؤال قبل الإججابة.
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
13. استخدم Markdown code fences للكود، مثل:
\`\`\`lua
الكود
\`\`\`
14. لا تضع الكود خارج code fence إذا كان المقصود نسخه.
`;

/* =========================================================
   BUILD CONTENTS
========================================================= */

function buildContents({
  message,
  history = []
}) {
  const contents = [];

  for (const item of history) {
    if (
      !item ||
      !["user", "assistant", "model"].includes(
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

  return contents;
}

/* =========================================================
   NORMAL AI REQUEST
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

  const contents = buildContents({
    message,
    history
  });

  const response =
    await ai.models.generateContent({
      model: MODEL,

      contents,

      config: {
        systemInstruction:
          instructions ||
          LUNEX_INSTRUCTIONS,

        maxOutputTokens:
          Number(
            process.env.AI_MAX_TOKENS
          ) || 5000
      }
    });

  const text =
    response?.text || "";

  if (!text.trim()) {
    throw new Error(
      "Gemini returned an empty response."
    );
  }

  return text;
}

/* =========================================================
   STREAM CHAT
========================================================= */

app.post(
  "/api/chat/stream",
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

      const contents =
        buildContents({
          message,
          history
        });

      /*
       * SSE
       */

      res.status(200);

      res.setHeader(
        "Content-Type",
        "text/event-stream; charset=utf-8"
      );

      res.setHeader(
        "Cache-Control",
        "no-cache, no-transform"
      );

      res.setHeader(
        "Connection",
        "keep-alive"
      );

      res.setHeader(
        "X-Accel-Buffering",
        "no"
      );

      if (res.flushHeaders) {
        res.flushHeaders();
      }

      const sendEvent = (
        type,
        data
      ) => {
        res.write(
          `event: ${type}\n`
        );

        res.write(
          `data: ${JSON.stringify(
            data
          )}\n\n`
        );
      };

      sendEvent("start", {
        model: MODEL
      });

      console.log(
        "Starting Gemini stream:",
        MODEL
      );

      const stream =
        await ai.models.generateContentStream({
          model: MODEL,

          contents,

          config: {
            systemInstruction:
              LUNEX_INSTRUCTIONS,

            maxOutputTokens:
              Number(
                process.env.AI_MAX_TOKENS
              ) || 5000
          }
        });

      let fullText = "";

      for await (
        const chunk of stream
      ) {
        const text =
          typeof chunk?.text ===
          "string"
            ? chunk.text
            : "";

        if (!text) {
          continue;
        }

        fullText += text;

        sendEvent("chunk", {
          text
        });
      }

      sendEvent("done", {
        text: fullText
      });

      res.end();

      console.log(
        "Gemini stream completed."
      );

    } catch (error) {
      console.error(
        "STREAM CHAT ERROR:",
        error
      );

      /*
       * إذا ما زلنا نقدر نرسل SSE،
       * أرسل الخطأ للواجهة.
       */

      try {
        res.write(
          `event: error\n`
        );

        res.write(
          `data: ${JSON.stringify({
            error:
              error?.message ||
              "تعذر إكمال الطلب."
          })}\n\n`
        );

        res.end();

      } catch {
        if (!res.headersSent) {
          res.status(500).json({
            ok: false,
            error:
              error?.message ||
              "تعذر إكمال الطلب."
          });
        }
      }
    }
  }
);

/* =========================================================
   NORMAL CHAT FALLBACK
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
          instructions:
            LUNEX_INSTRUCTIONS
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
          error:
            "اكتب وصف التصميم أولًا."
        });
      }

      const design =
        await askAI({
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

const frontendPath =
  path.join(
    __dirname,
    "..",
    "frontend"
  );

app.use(
  express.static(frontendPath)
);

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
   ERROR
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

    console.log(
      `Gemini model: ${MODEL}`
    );
  }
);