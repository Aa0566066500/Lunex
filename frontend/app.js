"use strict";

/* =========================================================
   LUNEX APP
========================================================= */

/* =========================================================
   STATE
========================================================= */

let conversations = [];
let projects = [];

let currentConversationId = null;
let currentProjectId = null;

let isSending = false;

let selectedFiles = [];

let latestErrorReport = "";

/* =========================================================
   ELEMENTS
========================================================= */

const chatMessages =
  document.getElementById("chatMessages");

const chatForm =
  document.getElementById("chatForm");

const messageInput =
  document.getElementById("messageInput");

const sendButton =
  document.getElementById("sendButton");

const fileInput =
  document.getElementById("fileInput");

const attachButton =
  document.getElementById("attachButton");

const attachmentPreview =
  document.getElementById("attachmentPreview");

const conversationList =
  document.getElementById("conversationList");

const newChatButton =
  document.getElementById("newChatButton");

/* =========================================================
   SVG
========================================================= */

const COPY_ICON = `
<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.8"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <rect
    x="8"
    y="8"
    width="11"
    height="11"
    rx="2"
  ></rect>

  <path
    d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"
  ></path>
</svg>
`;

const CHECK_ICON = `
<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <path d="m5 12 4 4L19 6"></path>
</svg>
`;

/* =========================================================
   STORAGE
========================================================= */

function loadStorage() {
  try {
    const savedConversations =
      localStorage.getItem(
        "lunex_conversations"
      );

    const savedProjects =
      localStorage.getItem(
        "lunex_projects"
      );

    conversations =
      savedConversations
        ? JSON.parse(savedConversations)
        : [];

    projects =
      savedProjects
        ? JSON.parse(savedProjects)
        : [];

    if (!Array.isArray(conversations)) {
      conversations = [];
    }

    if (!Array.isArray(projects)) {
      projects = [];
    }

  } catch (error) {
    console.error(
      "Storage load error:",
      error
    );

    conversations = [];
    projects = [];
  }
}

function saveStorage() {
  try {
    localStorage.setItem(
      "lunex_conversations",
      JSON.stringify(conversations)
    );

    localStorage.setItem(
      "lunex_projects",
      JSON.stringify(projects)
    );

  } catch (error) {
    console.error(
      "Storage save error:",
      error
    );
  }
}

/* =========================================================
   HELPERS
========================================================= */

function createId(prefix) {
  return (
    prefix +
    "_" +
    Date.now() +
    "_" +
    Math.random()
      .toString(36)
      .slice(2, 10)
  );
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sleep(ms) {
  return new Promise(
    (resolve) =>
      setTimeout(resolve, ms)
  );
}

function scrollChat() {
  if (!chatMessages) return;

  chatMessages.scrollTop =
    chatMessages.scrollHeight;
}

function getCurrentConversation() {
  return conversations.find(
    (conversation) =>
      conversation.id ===
      currentConversationId
  );
}

function getCurrentProject() {
  return projects.find(
    (project) =>
      project.id ===
      currentProjectId
  );
}

/* =========================================================
   NAVIGATION
========================================================= */

function showPage(pageName) {
  document
    .querySelectorAll(".page")
    .forEach((page) => {
      page.classList.remove("active");
    });

  const page =
    document.getElementById(
      `page-${pageName}`
    );

  if (page) {
    page.classList.add("active");
  }

  document
    .querySelectorAll(
      ".nav-item[data-page]"
    )
    .forEach((item) => {
      item.classList.toggle(
        "active",
        item.dataset.page ===
          pageName
      );
    });

  const titles = {
    chat: "Lunex",
    projects: "المشاريع",
    project: "المشروع",
    designer: "مصمم الواجهات",
    settings: "الإعدادات"
  };

  const pageTitle =
    document.getElementById(
      "pageTitle"
    );

  if (pageTitle) {
    pageTitle.textContent =
      titles[pageName] ||
      "Lunex";
  }

  closeSidebar();
}

/* =========================================================
   NAV BUTTONS
========================================================= */

document
  .querySelectorAll(
    ".nav-item[data-page]"
  )
  .forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        const page =
          button.dataset.page;

        if (page === "projects") {
          renderProjects();
        }

        showPage(page);
      }
    );
  });

/* =========================================================
   NEW CHAT
========================================================= */

function createNewChat() {
  const conversation = {
    id: createId("chat"),

    title:
      "محادثة جديدة",

    messages: [],

    createdAt:
      Date.now()
  };

  conversations.unshift(
    conversation
  );

  currentConversationId =
    conversation.id;

  saveStorage();

  renderConversationList();

  renderCurrentConversation();

  showPage("chat");

  setTimeout(
    () => {
      messageInput?.focus();
    },
    50
  );
}

newChatButton?.addEventListener(
  "click",
  createNewChat
);

/* =========================================================
   CONVERSATIONS
========================================================= */

function renderConversationList() {
  if (!conversationList) return;

  conversationList.innerHTML = "";

  if (!conversations.length) {
    return;
  }

  conversations.forEach(
    (conversation) => {
      const button =
        document.createElement(
          "button"
        );

      button.type = "button";

      button.className =
        "conversation-item";

      if (
        conversation.id ===
        currentConversationId
      ) {
        button.classList.add(
          "active"
        );
      }

      button.textContent =
        conversation.title ||
        "محادثة جديدة";

      button.addEventListener(
        "click",
        () => {
          currentConversationId =
            conversation.id;

          renderConversationList();

          renderCurrentConversation();

          showPage("chat");
        }
      );

      conversationList.appendChild(
        button
      );
    }
  );
}

/* =========================================================
   CURRENT CHAT
========================================================= */

function renderCurrentConversation() {
  if (!chatMessages) return;

  chatMessages.innerHTML = "";

  const conversation =
    getCurrentConversation();

  if (
    !conversation ||
    !Array.isArray(
      conversation.messages
    ) ||
    !conversation.messages.length
  ) {
    chatMessages.innerHTML = `
      <div
        id="welcome"
        class="welcome"
      >
        <div class="welcome-logo">
          L
        </div>

        <h1>
          كيف أقدر أساعدك؟
        </h1>

        <p>
          برمجة، Luau، Roblox Studio، أفكار ومشاريع.
        </p>
      </div>
    `;

    return;
  }

  conversation.messages.forEach(
    (message) => {
      renderStoredMessage(
        message
      );
    }
  );

  scrollChat();
}

/* =========================================================
   STORED MESSAGE
========================================================= */

function renderStoredMessage(
  message
) {
  const element =
    document.createElement(
      "div"
    );

  element.className =
    `message ${
      message.role === "user"
        ? "user-message"
        : "assistant-message"
    }`;

  const content =
    document.createElement(
      "div"
    );

  content.className =
    "message-content";

  element.appendChild(
    content
  );

  chatMessages.appendChild(
    element
  );

  if (
    message.role === "assistant"
  ) {
    renderAssistantContent(
      content,
      message.content,
      false
    );
  } else {
    content.innerHTML =
      escapeHTML(
        message.content
      ).replace(
        /\n/g,
        "<br>"
      );
  }
}

/* =========================================================
   MARKDOWN / CODE PARSER
========================================================= */

function parseResponse(text) {
  const blocks = [];

  const source =
    String(text || "");

  const regex =
    /```([a-zA-Z0-9_+#.-]*)[ \t]*\n?([\s\S]*?)```/g;

  let lastIndex = 0;
  let match;

  while (
    (match = regex.exec(source))
  ) {
    const before =
      source.slice(
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

      code:
        match[2].replace(
          /^\n+|\n+$/g,
          ""
        )
    });

    lastIndex =
      regex.lastIndex;
  }

  const remaining =
    source.slice(lastIndex);

  if (remaining.trim()) {
    blocks.push({
      type: "text",
      content: remaining
    });
  }

  if (!blocks.length) {
    blocks.push({
      type: "text",
      content: source
    });
  }

  return blocks;
}

/* =========================================================
   ASSISTANT CONTENT
========================================================= */

async function renderAssistantContent(
  container,
  text,
  animate = true
) {
  container.innerHTML = "";

  const blocks =
    parseResponse(text);

  for (
    const block of blocks
  ) {
    if (
      block.type ===
      "text"
    ) {
      const textElement =
        document.createElement(
          "div"
        );

      textElement.className =
        "lunex-text";

      container.appendChild(
        textElement
      );

      if (animate) {
        await typeText(
          textElement,
          block.content
        );
      } else {
        textElement.innerHTML =
          formatPlainText(
            block.content
          );
      }

      continue;
    }

    if (
      block.type ===
      "code"
    ) {
      const codeBox =
        createCodeBox(
          block.code,
          block.language
        );

      container.appendChild(
        codeBox
      );

      const codeElement =
        codeBox.querySelector(
          "code"
        );

      if (animate) {
        await typeCode(
          codeElement,
          block.code
        );
      } else {
        codeElement.textContent =
          block.code;
      }

      scrollChat();
    }
  }
}

/* =========================================================
   TEXT FORMAT
========================================================= */

function formatPlainText(
  text
) {
  return escapeHTML(
    text
  ).replace(
    /\n/g,
    "<br>"
  );
}

/* =========================================================
   TYPE TEXT
========================================================= */

async function typeText(
  element,
  text
) {
  if (!element) return;

  element.textContent = "";

  const source =
    String(text || "");

  let index = 0;

  /*
   * سرعة الكتابة:
   * النص العادي يظهر حرفًا حرفًا.
   */

  while (
    index < source.length
  ) {
    let amount = 1;

    /*
     * إذا كان النص طويلًا،
     * نسرّع قليلًا حتى لا تصبح
     * الإجابة بطيئة جدًا.
     */

    if (
      source.length > 8000
    ) {
      amount = 4;
    } else if (
      source.length > 4000
    ) {
      amount = 3;
    } else if (
      source.length > 1500
    ) {
      amount = 2;
    }

    element.textContent +=
      source.slice(
        index,
        index + amount
      );

    index += amount;

    scrollChat();

    /*
     * توقف بسيط بين الحروف.
     */

    await sleep(
      source.length > 4000
        ? 2
        : 10
    );
  }

  /*
   * بعد انتهاء الكتابة
   * نحول الأسطر إلى HTML.
   */

  element.innerHTML =
    formatPlainText(
      source
    );

  scrollChat();
}

/* =========================================================
   CODE BOX
========================================================= */

function createCodeBox(
  code,
  language
) {
  const box =
    document.createElement(
      "div"
    );

  box.className =
    "lunex-code";

  box.innerHTML = `
    <div class="lunex-code-header">

      <span
        class="lunex-code-language"
      >
        ${escapeHTML(
          language ||
            "lua"
        )}
      </span>

      <button
        type="button"
        class="lunex-copy"
        aria-label="نسخ الكود"
        title="نسخ الكود"
      >
        ${COPY_ICON}
      </button>

    </div>

    <pre
      class="lunex-code-body"
    ><code></code></pre>
  `;

  const copyButton =
    box.querySelector(
      ".lunex-copy"
    );

  copyButton?.addEventListener(
    "click",
    () => {
      copyCode(
        copyButton,
        code
      );
    }
  );

  return box;
}

/* =========================================================
   TYPE CODE
========================================================= */

async function typeCode(
  element,
  code
) {
  if (!element) return;

  element.textContent = "";

  const source =
    String(code || "");

  let index = 0;

  while (
    index < source.length
  ) {
    let amount = 2;
    let delay = 8;

    /*
     * الكود القصير:
     * حرفين تقريبًا كل مرة.
     */

    if (
      source.length > 12000
    ) {
      amount = 30;
      delay = 1;
    } else if (
      source.length > 8000
    ) {
      amount = 20;
      delay = 2;
    } else if (
      source.length > 5000
    ) {
      amount = 12;
      delay = 3;
    } else if (
      source.length > 2000
    ) {
      amount = 7;
      delay = 5;
    }

    element.textContent +=
      source.slice(
        index,
        index + amount
      );

    index += amount;

    scrollChat();

    await sleep(delay);
  }

  /*
   * نخلي الكود كاملًا في DOM
   * بعد انتهاء الأنيميشن.
   */

  element.textContent =
    source;

  scrollChat();
}

/* =========================================================
   COPY CODE
========================================================= */

async function copyCode(
  button,
  code
) {
  try {
    await navigator.clipboard.writeText(
      String(code || "")
    );

    button.innerHTML =
      CHECK_ICON;

    button.classList.add(
      "copied"
    );

    setTimeout(
      () => {
        button.innerHTML =
          COPY_ICON;

        button.classList.remove(
          "copied"
        );
      },
      1500
    );

  } catch (error) {
    console.error(
      "Copy code error:",
      error
    );

    /*
     * fallback للمتصفحات
     * التي تمنع Clipboard API.
     */

    try {
      const textarea =
        document.createElement(
          "textarea"
        );

      textarea.value =
        String(code || "");

      textarea.style.position =
        "fixed";

      textarea.style.opacity =
        "0";

      document.body.appendChild(
        textarea
      );

      textarea.select();

      document.execCommand(
        "copy"
      );

      textarea.remove();

      button.innerHTML =
        CHECK_ICON;

      setTimeout(
        () => {
          button.innerHTML =
            COPY_ICON;
        },
        1500
      );

    } catch (
      fallbackError
    ) {
      console.error(
        "Copy fallback error:",
        fallbackError
      );
    }
  }
}

/* =========================================================
   SEND CHAT
========================================================= */

async function sendMessage() {
  if (isSending) return;

  const text =
    messageInput?.value.trim();

  if (!text) return;

  isSending = true;

  if (sendButton) {
    sendButton.disabled =
      true;
  }

  /*
   * إذا ما فيه محادثة،
   * ننشئ محادثة.
   */

  if (!currentConversationId) {
    createNewChat();
  }

  const conversation =
    getCurrentConversation();

  if (!conversation) {
    isSending = false;

    if (sendButton) {
      sendButton.disabled =
        false;
    }

    return;
  }

  /*
   * إضافة رسالة المستخدم.
   */

  conversation.messages.push({
    role: "user",
    content: text,
    createdAt: Date.now()
  });

  /*
   * اسم المحادثة من أول رسالة.
   */

  if (
    conversation.messages
      .length === 1
  ) {
    conversation.title =
      text.length > 40
        ? text.slice(0, 40) +
          "..."
        : text;
  }

  saveStorage();

  renderConversationList();

  renderCurrentConversation();

  messageInput.value = "";

  /*
   * حذف الملفات المحددة
   * بعد الإرسال.
   */

  selectedFiles = [];

  if (fileInput) {
    fileInput.value = "";
  }

  renderAttachmentPreview();

  /*
   * رسالة مؤقتة أثناء الاتصال.
   */

  const typingElement =
    document.createElement(
      "div"
    );

  typingElement.className =
    "message assistant-message";

  typingElement.innerHTML = `
    <div class="message-content">
      <div class="lunex-thinking">
        <span>جاري التفكير</span>
        <span class="thinking-dots">
          <i></i>
          <i></i>
          <i></i>
        </span>
      </div>
    </div>
  `;

  chatMessages.appendChild(
    typingElement
  );

  scrollChat();

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
            message: text,

            history:
              conversation.messages
                .slice(0, -1)
          })
        }
      );

    let data = null;

    try {
      data =
        await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(
        data?.error ||
        "تعذر إكمال الطلب."
      );
    }

    const reply =
      data?.reply || "";

    /*
     * إزالة "جاري التفكير".
     */

    typingElement.remove();

    /*
     * إضافة رد المساعد.
     */

    conversation.messages.push({
      role: "assistant",
      content: reply,
      createdAt: Date.now()
    });

    saveStorage();

    /*
     * لا نستخدم renderCurrentConversation
     * هنا لأنه سيظهر الرد كاملًا.
     *
     * نضيفه ونشغّل animation مباشرة.
     */

    const element =
      document.createElement(
        "div"
      );

    element.className =
      "message assistant-message";

    const content =
      document.createElement(
        "div"
      );

    content.className =
      "message-content";

    element.appendChild(
      content
    );

    chatMessages.appendChild(
      element
    );

    await renderAssistantContent(
      content,
      reply,
      true
    );

    renderConversationList();

  } catch (error) {
    console.error(
      "CHAT ERROR:",
      error
    );

    typingElement.remove();

    const errorMessage =
      error?.message ||
      "تعذر إكمال الطلب.";

    conversation.messages.push({
      role: "assistant",
      content:
        `تعذر إكمال الطلب.\n\n${errorMessage}`,
      createdAt: Date.now()
    });

    saveStorage();

    renderCurrentConversation();
  } finally {
    isSending = false;

    if (sendButton) {
      sendButton.disabled =
        false;
    }

    messageInput?.focus();

    scrollChat();
  }
}

/* =========================================================
   CHAT SUBMIT
========================================================= */

chatForm?.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();

    sendMessage();
  }
);

/* =========================================================
   ENTER
========================================================= */

messageInput?.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      chatForm?.requestSubmit();
    }
  }
);

/* =========================================================
   FILE UPLOAD
========================================================= */

attachButton?.addEventListener(
  "click",
  () => {
    fileInput?.click();
  }
);

fileInput?.addEventListener(
  "change",
  () => {
    selectedFiles =
      Array.from(
        fileInput.files || []
      );

    renderAttachmentPreview();
  }
);

function renderAttachmentPreview() {
  if (!attachmentPreview) {
    return;
  }

  attachmentPreview.innerHTML =
    "";

  selectedFiles.forEach(
    (file, index) => {
      const item =
        document.createElement(
          "div"
        );

      item.className =
        "attachment-item";

      item.innerHTML = `
        <span>
          ${escapeHTML(
            file.name
          )}
        </span>

        <button
          type="button"
          aria-label="إزالة الملف"
          title="إزالة الملف"
        >
          ×
        </button>
      `;

      const removeButton =
        item.querySelector(
          "button"
        );

      removeButton?.addEventListener(
        "click",
        () => {
          selectedFiles.splice(
            index,
            1
          );

          renderAttachmentPreview();
        }
      );

      attachmentPreview.appendChild(
        item
      );
    }
  );
}

/* =========================================================
   PROJECT ELEMENTS
========================================================= */

const createProjectButton =
  document.getElementById(
    "createProjectButton"
  );

const projectModal =
  document.getElementById(
    "projectModal"
  );

const closeProjectModal =
  document.getElementById(
    "closeProjectModal"
  );

const projectNameInput =
  document.getElementById(
    "projectNameInput"
  );

const confirmCreateProject =
  document.getElementById(
    "confirmCreateProject"
  );

const projectList =
  document.getElementById(
    "projectList"
  );

/* =========================================================
   PROJECT MODAL
========================================================= */

function openProjectModal() {
  projectModal?.classList.remove(
    "hidden"
  );

  setTimeout(
    () => {
      projectNameInput?.focus();
    },
    50
  );
}

function closeProjectModalFn() {
  projectModal?.classList.add(
    "hidden"
  );

  if (projectNameInput) {
    projectNameInput.value =
      "";
  }
}

createProjectButton?.addEventListener(
  "click",
  openProjectModal
);

closeProjectModal?.addEventListener(
  "click",
  closeProjectModalFn
);

projectModal?.addEventListener(
  "click",
  (event) => {
    if (
      event.target ===
      projectModal
    ) {
      closeProjectModalFn();
    }
  }
);

projectNameInput?.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key === "Enter"
    ) {
      event.preventDefault();

      confirmCreateProject?.click();
    }
  }
);

/* =========================================================
   CREATE PROJECT
========================================================= */

confirmCreateProject?.addEventListener(
  "click",
  () => {
    const name =
      projectNameInput?.value.trim();

    if (!name) {
      projectNameInput?.focus();
      return;
    }

    const project = {
      id: createId("project"),

      name,

      code: "",

      errors: "",

      messages: [],

      /*
       * ملفات المشروع.
       */

      files: [],

      createdAt:
        Date.now()
    };

    projects.unshift(
      project
    );

    saveStorage();

    closeProjectModalFn();

    renderProjects();

    /*
     * افتح المشروع مباشرة.
     */

    openProject(
      project.id
    );
  }
);

/* =========================================================
   PROJECT LIST
========================================================= */

function renderProjects() {
  if (!projectList) return;

  projectList.innerHTML = "";

  if (!projects.length) {
    projectList.innerHTML = `
      <div class="empty-state">
        لا توجد مشاريع حتى الآن.
      </div>
    `;

    return;
  }

  projects.forEach(
    (project) => {
      const card =
        document.createElement(
          "button"
        );

      card.type = "button";

      card.className =
        "project-card";

      card.innerHTML = `
        <strong>
          ${escapeHTML(
            project.name
          )}
        </strong>

        <span>
          فتح المشروع
        </span>
      `;

      card.addEventListener(
        "click",
        () => {
          openProject(
            project.id
          );
        }
      );

      projectList.appendChild(
        card
      );
    }
  );
}

/* =========================================================
   OPEN PROJECT
========================================================= */

function openProject(
  projectId
) {
  currentProjectId =
    projectId;

  const project =
    projects.find(
      (item) =>
        item.id ===
        projectId
    );

  if (!project) return;

  if (
    !Array.isArray(
      project.files
    )
  ) {
    project.files = [];
  }

  const name =
    document.getElementById(
      "workspaceProjectName"
    );

  const editor =
    document.getElementById(
      "codeEditor"
    );

  if (name) {
    name.textContent =
      project.name;
  }

  if (editor) {
    editor.value =
      project.code || "";
  }

  latestErrorReport =
    project.errors || "";

  showPage("project");
}

/* =========================================================
   BACK TO PROJECTS
========================================================= */

document
  .getElementById(
    "backToProjects"
  )
  ?.addEventListener(
    "click",
    () => {
      renderProjects();

      showPage(
        "projects"
      );
    }
  );

/* =========================================================
   WORKSPACE TABS
========================================================= */

document
  .querySelectorAll(
    ".workspace-tab"
  )
  .forEach(
    (tab) => {
      tab.addEventListener(
        "click",
        () => {
          const workspace =
            tab.dataset.workspace;

          document
            .querySelectorAll(
              ".workspace-tab"
            )
            .forEach(
              (item) => {
                item.classList.remove(
                  "active"
                );
              }
            );

          tab.classList.add(
            "active"
          );

          document
            .querySelectorAll(
              ".workspace-panel"
            )
            .forEach(
              (panel) => {
                panel.classList.remove(
                  "active"
                );
              }
            );

          const panel =
            document.getElementById(
              `workspace-${workspace}`
            );

          panel?.classList.add(
            "active"
          );

          /*
           * عند فتح صفحة الأخطاء
           * نعرض آخر تقرير محفوظ.
           */

          if (
            workspace ===
            "errors"
          ) {
            const project =
              getCurrentProject();

            renderErrorReport(
              project?.errors ||
              latestErrorReport ||
              ""
            );
          }
        }
      );
    }
  );

/* =========================================================
   SAVE PROJECT CODE
========================================================= */

const codeEditor =
  document.getElementById(
    "codeEditor"
  );

codeEditor?.addEventListener(
  "input",
  () => {
    const project =
      getCurrentProject();

    if (!project) return;

    project.code =
      codeEditor.value;

    saveStorage();
  }
);

/* =========================================================
   CODE ANALYZER
========================================================= */

const analyzeCodeButton =
  document.getElementById(
    "analyzeCodeButton"
  );

const analyzerStatus =
  document.getElementById(
    "analyzerStatus"
  );

const errorResults =
  document.getElementById(
    "errorResults"
  );

const copyErrorsButton =
  document.getElementById(
    "copyErrorsButton"
  );

analyzeCodeButton?.addEventListener(
  "click",
  async () => {
    const project =
      getCurrentProject();

    if (!project) return;

    const code =
      codeEditor?.value || "";

    if (!code.trim()) {
      if (analyzerStatus) {
        analyzerStatus.textContent =
          "اكتب كود Luau أولًا.";
      }

      return;
    }

    analyzeCodeButton.disabled =
      true;

    if (analyzerStatus) {
      analyzerStatus.textContent =
        "جاري الفحص...";
    }

    if (errorResults) {
      errorResults.innerHTML = `
        <div class="empty-state">
          جاري فحص الكود...
        </div>
      `;
    }

    try {
      const response =
        await fetch(
          "/api/analyze",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              code
            })
          }
        );

      let data = null;

      try {
        data =
          await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
          "تعذر فحص الكود."
        );
      }

      latestErrorReport =
        data?.report || "";

      project.errors =
        latestErrorReport;

      saveStorage();

      renderErrorReport(
        latestErrorReport
      );

      if (analyzerStatus) {
        analyzerStatus.textContent =
          "اكتمل الفحص.";
      }

      /*
       * الانتقال إلى الأخطاء.
       */

      document
        .querySelector(
          '[data-workspace="errors"]'
        )
        ?.click();

    } catch (error) {
      console.error(
        "Analyzer error:",
        error
      );

      if (analyzerStatus) {
        analyzerStatus.textContent =
          "حدث خطأ أثناء الفحص.";
      }

      if (errorResults) {
        errorResults.innerHTML = `
          <div class="lunex-error">
            ${escapeHTML(
              error?.message ||
              "تعذر فحص الكود."
            )}
          </div>
        `;
      }

    } finally {
      analyzeCodeButton.disabled =
        false;
    }
  }
);

/* =========================================================
   ERROR REPORT
========================================================= */

function renderErrorReport(
  report
) {
  if (!errorResults) return;

  const text =
    String(report || "");

  if (!text.trim()) {
    errorResults.innerHTML = `
      <div class="empty-state">
        لم يتم العثور على أخطاء.
      </div>
    `;

    return;
  }

  errorResults.innerHTML = `
    <div class="error-report">
      ${escapeHTML(
        text
      ).replace(
        /\n/g,
        "<br>"
      )}
    </div>
  `;
}

/* =========================================================
   COPY ERRORS
========================================================= */

copyErrorsButton?.addEventListener(
  "click",
  async () => {
    const project =
      getCurrentProject();

    const report =
      project?.errors ||
      latestErrorReport ||
      "";

    if (!report.trim()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        report
      );

      const oldHTML =
        copyErrorsButton.innerHTML;

      copyErrorsButton.innerHTML =
        `${CHECK_ICON} تم النسخ`;

      setTimeout(
        () => {
          copyErrorsButton.innerHTML =
            oldHTML;
        },
        1500
      );

    } catch (error) {
      console.error(
        "Copy errors:",
        error
      );
    }
  }
);

/* =========================================================
   PROJECT CHAT
========================================================= */

const projectChatMessages =
  document.getElementById(
    "projectChatMessages"
  );

const projectChatForm =
  document.getElementById(
    "projectChatForm"
  );

const projectChatInput =
  document.getElementById(
    "projectChatInput"
  );

async function sendProjectMessage() {
  const project =
    getCurrentProject();

  if (!project) return;

  const text =
    projectChatInput?.value.trim();

  if (!text) return;

  if (
    !Array.isArray(
      project.messages
    )
  ) {
    project.messages = [];
  }

  project.messages.push({
    role: "user",
    content: text,
    createdAt: Date.now()
  });

  projectChatInput.value = "";

  saveStorage();

  renderProjectChat();

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
            message: `
أنت داخل مشروع Roblox اسمه "${project.name}".

كود المشروع الحالي:

\`\`\`lua
${String(
  project.code || ""
).slice(0, 100000)}
\`\`\`

أخطاء آخر فحص:

${String(
  project.errors || "لا يوجد تقرير."
).slice(0, 30000)}

سؤال المستخدم:

${text}
`,

            history:
              project.messages
                .slice(0, -1)
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

    project.messages.push({
      role: "assistant",
      content:
        data?.reply || "",
      createdAt: Date.now()
    });

    saveStorage();

    renderProjectChat();

  } catch (error) {
    project.messages.push({
      role: "assistant",
      content:
        `تعذر إكمال الطلب.\n\n${
          error?.message ||
          "حدث خطأ."
        }`,
      createdAt: Date.now()
    });

    saveStorage();

    renderProjectChat();
  }
}

projectChatForm?.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();

    sendProjectMessage();
  }
);

projectChatInput?.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      projectChatForm?.requestSubmit();
    }
  }
);

function renderProjectChat() {
  if (!projectChatMessages) {
    return;
  }

  projectChatMessages.innerHTML =
    "";

  const project =
    getCurrentProject();

  if (
    !project ||
    !project.messages?.length
  ) {
    projectChatMessages.innerHTML = `
      <div class="empty-state">
        اسأل Lunex عن مشروعك.
      </div>
    `;

    return;
  }

  project.messages.forEach(
    (message) => {
      const element =
        document.createElement(
          "div"
        );

      element.className =
        `message ${
          message.role === "user"
            ? "user-message"
            : "assistant-message"
        }`;

      const content =
        document.createElement(
          "div"
        );

      content.className =
        "message-content";

      element.appendChild(
        content
      );

      projectChatMessages.appendChild(
        element
      );

      if (
        message.role ===
        "assistant"
      ) {
        renderAssistantContent(
          content,
          message.content,
          false
        );
      } else {
        content.innerHTML =
          formatPlainText(
            message.content
          );
      }
    }
  );

  projectChatMessages.scrollTop =
    projectChatMessages.scrollHeight;
}

/* =========================================================
   UI DESIGNER
========================================================= */

const designerForm =
  document.getElementById(
    "designerForm"
  );

const designerInput =
  document.getElementById(
    "designerInput"
  );

const designerResult =
  document.getElementById(
    "designerResult"
  );

designerForm?.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    const request =
      designerInput?.value.trim();

    if (!request) return;

    const button =
      designerForm.querySelector(
        "button[type='submit']"
      );

    if (button) {
      button.disabled =
        true;
    }

    if (designerResult) {
      designerResult.innerHTML = `
        <div class="empty-state">
          جاري تصميم الواجهة...
        </div>
      `;
    }

    try {
      const response =
        await fetch(
          "/api/ui-design",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              request
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
          "تعذر إنشاء التصميم."
        );
      }

      if (designerResult) {
        designerResult.innerHTML = `
          <div class="designer-output">
            ${escapeHTML(
              data?.design || ""
            ).replace(
              /\n/g,
              "<br>"
            )}
          </div>
        `;
      }

    } catch (error) {
      if (designerResult) {
        designerResult.innerHTML = `
          <div class="lunex-error">
            ${escapeHTML(
              error?.message ||
              "تعذر إنشاء التصميم."
            )}
          </div>
        `;
      }

    } finally {
      if (button) {
        button.disabled =
          false;
      }
    }
  }
);

/* =========================================================
   MOBILE SIDEBAR
========================================================= */

const sidebar =
  document.getElementById(
    "sidebar"
  );

const sidebarOverlay =
  document.getElementById(
    "sidebarOverlay"
  );

const mobileMenu =
  document.getElementById(
    "mobileMenu"
  );

const mobileClose =
  document.getElementById(
    "mobileClose"
  );

function openSidebar() {
  sidebar?.classList.add(
    "open"
  );

  sidebarOverlay?.classList.add(
    "active"
  );
}

function closeSidebar() {
  sidebar?.classList.remove(
    "open"
  );

  sidebarOverlay?.classList.remove(
    "active"
  );
}

mobileMenu?.addEventListener(
  "click",
  openSidebar
);

mobileClose?.addEventListener(
  "click",
  closeSidebar
);

sidebarOverlay?.addEventListener(
  "click",
  closeSidebar
);

/* =========================================================
   ESCAPE MODAL
========================================================= */

document.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key === "Escape"
    ) {
      closeProjectModalFn();

      closeSidebar();
    }
  }
);

/* =========================================================
   INIT
========================================================= */

function init() {
  loadStorage();

  renderConversationList();

  renderProjects();

  /*
   * استعادة آخر محادثة.
   */

  if (conversations.length) {
    currentConversationId =
      conversations[0].id;

    renderConversationList();

    renderCurrentConversation();
  } else {
    showPage("chat");
  }

  console.log(
    "Lunex frontend loaded."
  );
}

init();