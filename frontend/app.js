"use strict";

const chat = document.querySelector("#chat");
const input = document.querySelector("#message");
const sendButton = document.querySelector("#send");

let isTyping = false;

/* =========================================================
   SVG ICONS
========================================================= */

const ICON_COPY = `
<svg viewBox="0 0 24 24" aria-hidden="true">
  <rect x="8" y="8" width="11" height="11" rx="2"></rect>
  <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path>
</svg>
`;

const ICON_CHECK = `
<svg viewBox="0 0 24 24" aria-hidden="true">
  <path d="m5 12 4 4L19 6"></path>
</svg>
`;

/* =========================================================
   HELPERS
========================================================= */

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/*
 * يحول:
 *
 * ```lua
 * print("Hello")
 * ```
 *
 * إلى Code Block مستقل.
 */

function renderMessage(text) {
  const blocks = [];

  const codePattern =
    /```([a-zA-Z0-9_+-]*)\n?([\s\S]*?)```/g;

  let lastIndex = 0;
  let match;

  while ((match = codePattern.exec(text)) !== null) {
    const before = text.slice(
      lastIndex,
      match.index
    );

    if (before.trim()) {
      blocks.push({
        type: "text",
        content: before
      });
    }

    blocks.push({
      type: "code",
      language:
        match[1] ||
        "lua",
      code: match[2].replace(
        /^\n+|\n+$/g,
        ""
      )
    });

    lastIndex = codePattern.lastIndex;
  }

  const remaining = text.slice(lastIndex);

  if (remaining.trim()) {
    blocks.push({
      type: "text",
      content: remaining
    });
  }

  if (!blocks.length) {
    blocks.push({
      type: "text",
      content: text
    });
  }

  return blocks
    .map((block) => {
      if (block.type === "text") {
        return `
          <div class="lunex-text">
            ${escapeHTML(block.content)
              .replace(/\n/g, "<br>")}
          </div>
        `;
      }

      return createCodeBlock(
        block.code,
        block.language
      );
    })
    .join("");
}

/* =========================================================
   CODE BLOCK
========================================================= */

function createCodeBlock(
  code,
  language = "lua"
) {
  const id =
    "code-" +
    Math.random()
      .toString(36)
      .slice(2);

  return `
    <div
      class="lunex-code"
      data-code-id="${id}"
    >

      <div class="lunex-code-header">

        <span class="lunex-code-language">
          ${escapeHTML(
            language || "lua"
          )}
        </span>

        <button
          class="lunex-copy"
          type="button"
          data-copy-id="${id}"
          aria-label="نسخ الكود"
          title="نسخ الكود"
        >
          ${ICON_COPY}
        </button>

      </div>

      <pre class="lunex-code-body"><code id="${id}"></code></pre>

    </div>
  `;
}

/* =========================================================
   TYPE CODE ANIMATION
========================================================= */

async function typeCode(
  element,
  code,
  speed = 8
) {
  if (!element) return;

  element.textContent = "";

  let index = 0;

  while (index < code.length) {

    /*
     * نكتب أكثر من حرف في كل دورة حتى يكون
     * العرض سريعًا حتى مع الأكواد الطويلة.
     */

    const chunk =
      code.length > 5000
        ? 12
        : code.length > 2000
        ? 7
        : 3;

    element.textContent +=
      code.slice(
        index,
        index + chunk
      );

    index += chunk;

    element.parentElement.scrollTop =
      element.parentElement.scrollHeight;

    await new Promise(
      (resolve) =>
        setTimeout(resolve, speed)
    );
  }
}

/* =========================================================
   COPY
========================================================= */

async function copyCode(
  button,
  code
) {
  try {
    await navigator.clipboard.writeText(
      code
    );

    button.innerHTML =
      ICON_CHECK;

    button.classList.add(
      "copied"
    );

    setTimeout(() => {
      button.innerHTML =
        ICON_COPY;

      button.classList.remove(
        "copied"
      );
    }, 1600);

  } catch (error) {
    console.error(
      "Copy failed:",
      error
    );
  }
}

/* =========================================================
   MESSAGE ELEMENT
========================================================= */

function createAssistantMessage() {
  const message =
    document.createElement("div");

  message.className =
    "message assistant-message";

  message.innerHTML = `
    <div class="message-content"></div>
  `;

  chat.appendChild(message);

  return message;
}

/* =========================================================
   RENDER ASSISTANT RESPONSE
========================================================= */

async function renderAssistantResponse(
  messageElement,
  text
) {
  const content =
    messageElement.querySelector(
      ".message-content"
    );

  const blocks = [];

  const codePattern =
    /```([a-zA-Z0-9_+-]*)\n?([\s\S]*?)```/g;

  let lastIndex = 0;
  let match;

  while (
    (match = codePattern.exec(text)) !== null
  ) {
    const before =
      text.slice(
        lastIndex,
        match.index
      );

    if (before.trim()) {
      blocks.push({
        type: "text",
        content: before
      });
    }

    blocks.push({
      type: "code",
      language:
        match[1] || "lua",
      code: match[2].replace(
        /^\n+|\n+$/g,
        ""
      )
    });

    lastIndex =
      codePattern.lastIndex;
  }

  const remaining =
    text.slice(lastIndex);

  if (remaining.trim()) {
    blocks.push({
      type: "text",
      content: remaining
    });
  }

  if (!blocks.length) {
    blocks.push({
      type: "text",
      content: text
    });
  }

  for (const block of blocks) {

    if (block.type === "text") {

      const textElement =
        document.createElement("div");

      textElement.className =
        "lunex-text";

      textElement.innerHTML =
        escapeHTML(
          block.content
        ).replace(
          /\n/g,
          "<br>"
        );

      content.appendChild(
        textElement
      );

      continue;
    }

    const wrapper =
      document.createElement("div");

    wrapper.className =
      "lunex-code";

    const codeId =
      "code-" +
      Math.random()
        .toString(36)
        .slice(2);

    wrapper.innerHTML = `
      <div class="lunex-code-header">

        <span class="lunex-code-language">
          ${escapeHTML(
            block.language || "lua"
          )}
        </span>

        <button
          class="lunex-copy"
          type="button"
          aria-label="نسخ الكود"
          title="نسخ الكود"
        >
          ${ICON_COPY}
        </button>

      </div>

      <pre class="lunex-code-body">
        <code></code>
      </pre>
    `;

    const codeElement =
      wrapper.querySelector(
        "code"
      );

    const copyButton =
      wrapper.querySelector(
        ".lunex-copy"
      );

    copyButton.addEventListener(
      "click",
      () => {
        copyCode(
          copyButton,
          block.code
        );
      }
    );

    content.appendChild(
      wrapper
    );

    await typeCode(
      codeElement,
      block.code
    );
  }
}

/* =========================================================
   SEND MESSAGE
========================================================= */

async function sendMessage() {
  if (isTyping) return;

  const message =
    input?.value.trim();

  if (!message) return;

  isTyping = true;

  sendButton.disabled = true;

  /*
   * رسالة المستخدم
   */

  const userMessage =
    document.createElement("div");

  userMessage.className =
    "message user-message";

  userMessage.innerHTML = `
    <div class="message-content">
      ${escapeHTML(message)
        .replace(/\n/g, "<br>")}
    </div>
  `;

  chat.appendChild(
    userMessage
  );

  input.value = "";

  /*
   * رسالة المساعد
   */

  const assistantMessage =
    createAssistantMessage();

  const content =
    assistantMessage.querySelector(
      ".message-content"
    );

  content.innerHTML = `
    <div class="lunex-thinking">
      <span>جاري الكتابة</span>
      <i></i>
      <i></i>
      <i></i>
    </div>
  `;

  chat.scrollTop =
    chat.scrollHeight;

  try {

    const response =
      await fetch(
        "/api/chat",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            message
          })
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error ||
        "تعذر إكمال الطلب."
      );
    }

    await renderAssistantResponse(
      assistantMessage,
      data.reply || ""
    );

  } catch (error) {

    content.innerHTML = `
      <div class="lunex-error">
        ${escapeHTML(
          error.message ||
          "تعذر إكمال الطلب."
        )}
      </div>
    `;

  } finally {

    isTyping = false;

    sendButton.disabled =
      false;

    chat.scrollTop =
      chat.scrollHeight;
  }
}

/* =========================================================
   EVENTS
========================================================= */

if (sendButton) {
  sendButton.addEventListener(
    "click",
    sendMessage
  );
}

if (input) {
  input.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();

        sendMessage();
      }

    }
  );
}