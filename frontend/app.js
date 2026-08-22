"use strict";

/* =========================================================
   STATE
========================================================= */

let conversations = [];
let projects = [];

let currentConversationId = null;
let currentProjectId = null;

let isSending = false;

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
  document.getElementById(
    "attachmentPreview"
  );

const conversationList =
  document.getElementById(
    "conversationList"
  );

const newChatButton =
  document.getElementById(
    "newChatButton"
  );

/* =========================================================
   SVG ICONS
========================================================= */

const COPY_ICON = `
<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.8"
  stroke-linecap="round"
  stroke-linejoin="round"
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
>
  <path d="m5 12 4 4L19 6"></path>
</svg>
`;

/* =========================================================
   STORAGE
========================================================= */

function loadStorage() {
  try {
    conversations =
      JSON.parse(
        localStorage.getItem(
          "lunex_conversations"
        ) || "[]"
      );

    projects =
      JSON.parse(
        localStorage.getItem(
          "lunex_projects"
        ) || "[]"
      );

  } catch {
    conversations = [];
    projects = [];
  }
}

function saveStorage() {
  localStorage.setItem(
    "lunex_conversations",
    JSON.stringify(
      conversations
    )
  );

  localStorage.setItem(
    "lunex_projects",
    JSON.stringify(
      projects
    )
  );
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
      .slice(2, 9)
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

function scrollChat() {
  if (!chatMessages) return;

  chatMessages.scrollTop =
    chatMessages.scrollHeight;
}

/* =========================================================
   NAVIGATION
========================================================= */

function showPage(pageName) {
  document
    .querySelectorAll(".page")
    .forEach((page) => {
      page.classList.remove(
        "active"
      );
    });

  const page =
    document.getElementById(
      `page-${pageName}`
    );

  if (page) {
    page.classList.add(
      "active"
    );
  }

  document
    .querySelectorAll(".nav-item[data-page]")
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
}

document
  .querySelectorAll(
    ".nav-item[data-page]"
  )
  .forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        showPage(
          button.dataset.page
        );
      }
    );
  });

/* =========================================================
   NEW CHAT
========================================================= */

function createNewChat() {
  const conversation = {
    id: createId("chat"),
    title: "محادثة جديدة",
    messages: [],
    createdAt: Date.now()
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

  messageInput?.focus();
}

newChatButton?.addEventListener(
  "click",
  createNewChat
);

/* =========================================================
   CONVERSATION LIST
========================================================= */

function renderConversationList() {
  if (!conversationList) return;

  conversationList.innerHTML = "";

  conversations.forEach(
    (conversation) => {
      const button =
        document.createElement(
          "button"
        );

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

function getCurrentConversation() {
  return conversations.find(
    (item) =>
      item.id ===
      currentConversationId
  );
}

function renderCurrentConversation() {
  if (!chatMessages) return;

  chatMessages.innerHTML = "";

  const conversation =
    getCurrentConversation();

  if (
    !conversation ||
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
   PARSE AI RESPONSE
========================================================= */

function parseResponse(text) {
  const blocks = [];

  const regex =
    /```([a-zA-Z0-9_+-]*)\n?([\s\S]*?)```/g;

  let lastIndex = 0;
  let match;

  while (
    (match = regex.exec(text))
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

      textElement.innerHTML =
        escapeHTML(
          block.content
        ).replace(
          /\n/g,
          "<br>"
        );

      container.appendChild(
        textElement
      );

      continue;
    }

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

      <span class="lunex-code-language">
        ${escapeHTML(
          language || "lua"
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

    <pre class="lunex-code-body"><code></code></pre>
  `;

  const copyButton =
    box.querySelector(
      ".lunex-copy"
    );

  copyButton.addEventListener(
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

  let index = 0;

  while (
    index < code.length
  ) {
    let amount = 3;

    if (
      code.length > 10000
    ) {
      amount = 20;
    } else if (
      code.length > 5000
    ) {
      amount = 12;
    } else if (
      code.length > 2000
    ) {
      amount = 7;
    }

    element.textContent +=
      code.slice(
        index,
        index + amount
      );

    index += amount;

    scrollChat();

    await new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          8
        )
    );
  }
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
      code
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
      "Copy error:",
      error
    );
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

  sendButton.disabled =
    true;

  /*
   * إذا ما فيه محادثة،
   * أنشئ وحدة تلقائيًا.
   */

  if (
    !currentConversationId
  ) {
    createNewChat();
  }

  const conversation =
    getCurrentConversation();

  if (!conversation) {
    isSending = false;
    sendButton.disabled =
      false;
    return;
  }

  /*
   * المستخدم
   */

  conversation.messages.push({
    role: "user",
    content: text,
    createdAt: Date.now()
  });

  /*
   * أول رسالة تصبح اسم المحادثة.
   */

  if (
    conversation.messages
      .length === 1
  ) {
    conversation.title =
      text.length > 35
        ? text.slice(0, 35) +
          "..."
        : text;
  }

  saveStorage();

  renderConversationList();

  renderCurrentConversation();

  messageInput.value = "";

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

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error ||
        "تعذر إكمال الطلب."
      );
    }

    const reply =
      data.reply || "";

    conversation.messages.push({
      role: "assistant",
      content: reply,
      createdAt: Date.now()
    });

    saveStorage();

    renderCurrentConversation();

  } catch (error) {
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

    sendButton.disabled =
      false;

    messageInput.focus();

    scrollChat();
  }
}

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
    const files =
      Array.from(
        fileInput.files || []
      );

    attachmentPreview.innerHTML =
      "";

    files.forEach(
      (file) => {
        const item =
          document.createElement(
            "div"
          );

        item.className =
          "attachment-item";

        item.textContent =
          file.name;

        attachmentPreview.appendChild(
          item
        );
      }
    );
  }
);

/* =========================================================
   PROJECTS
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

function openProjectModal() {
  projectModal?.classList.remove(
    "hidden"
  );

  setTimeout(
    () =>
      projectNameInput?.focus(),
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

confirmCreateProject?.addEventListener(
  "click",
  () => {
    const name =
      projectNameInput?.value.trim();

    if (!name) return;

    const project = {
      id: createId("project"),
      name,
      code: "",
      errors: "",
      messages: [],
      createdAt: Date.now()
    };

    projects.unshift(
      project
    );

    saveStorage();

    closeProjectModalFn();

    renderProjects();

    showPage("projects");
  }
);

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
      showPage("projects");
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
              (item) =>
                item.classList.remove(
                  "active"
                )
            );

          tab.classList.add(
            "active"
          );

          document
            .querySelectorAll(
              ".workspace-panel"
            )
            .forEach(
              (panel) =>
                panel.classList.remove(
                  "active"
                )
            );

          const panel =
            document.getElementById(
              `workspace-${workspace}`
            );

          panel?.classList.add(
            "active"
          );
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
      projects.find(
        (item) =>
          item.id ===
          currentProjectId
      );

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

let latestErrorReport = "";

analyzeCodeButton?.addEventListener(
  "click",
  async () => {
    const project =
      projects.find(
        (item) =>
          item.id ===
          currentProjectId
      );

    if (!project) return;

    const code =
      codeEditor?.value || "";

    if (!code.trim()) {
      analyzerStatus.textContent =
        "اكتب كود Luau أولًا.";

      return;
    }

    analyzeCodeButton.disabled =
      true;

    analyzerStatus.textContent =
      "جاري الفحص...";

    errorResults.innerHTML = `
      <div class="empty-state">
        جاري فحص الكود...
      </div>
    `;

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

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
          "تعذر فحص الكود."
        );
      }

      latestErrorReport =
        data.report || "";

      project.errors =
        latestErrorReport;

      saveStorage();

      renderErrorReport(
        latestErrorReport
      );

      analyzerStatus.textContent =
        "اكتمل الفحص.";

      /*
       * نفتح صفحة الأخطاء تلقائيًا.
       */

      document
        .querySelector(
          '[data-workspace="errors"]'
        )
        ?.click();

    } catch (error) {
      analyzerStatus.textContent =
        "حدث خطأ أثناء الفحص.";

      errorResults.innerHTML = `
        <div class="lunex-error">
          ${escapeHTML(
            error?.message ||
            "تعذر فحص الكود."
          )}
        </div>
      `;

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

  if (!report.trim()) {
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
        report
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
    if (!latestErrorReport) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        latestErrorReport
      );

      const old =
        copyErrorsButton.innerHTML;

      copyErrorsButton.innerHTML =
        `${CHECK_ICON} تم النسخ`;

      setTimeout(
        () => {
          copyErrorsButton.innerHTML =
            old;
        },
        1500
      );

    } catch (error) {
      console.error(
        error
      );
    }
  }
);

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

    button.disabled =
      true;

    designerResult.innerHTML = `
      <div class="empty-state">
        جاري تصميم الواجهة...
      </div>
    `;

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

      designerResult.innerHTML = `
        <div class="designer-output">
          ${escapeHTML(
            data.design || ""
          ).replace(
            /\n/g,
            "<br>"
          )}
        </div>
      `;

    } catch (error) {
      designerResult.innerHTML = `
        <div class="lunex-error">
          ${escapeHTML(
            error?.message ||
            "تعذر إنشاء التصميم."
          )}
        </div>
      `;

    } finally {
      button.disabled =
        false;
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
   INIT
========================================================= */

loadStorage();

renderConversationList();

renderProjects();

if (
  conversations.length
) {
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