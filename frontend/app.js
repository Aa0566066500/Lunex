"use strict";

/* =========================================================
   LUNEX — FRONTEND ENGINE
========================================================= */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

/* =========================================================
   STATE
========================================================= */

const state = {
  conversations: [],
  currentConversationId: null,

  projects: [],
  currentProjectId: null,

  attachments: [],
  isSending: false,
  isAnalyzing: false
};

/* =========================================================
   STORAGE
========================================================= */

const STORAGE_KEY = "lunex_state_v1";

function saveState() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        conversations: state.conversations,
        projects: state.projects,
        currentConversationId:
          state.currentConversationId,
        currentProjectId:
          state.currentProjectId
      })
    );
  } catch (error) {
    console.warn("Lunex storage error:", error);
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return;

    const data = JSON.parse(raw);

    if (Array.isArray(data.conversations)) {
      state.conversations = data.conversations;
    }

    if (Array.isArray(data.projects)) {
      state.projects = data.projects;
    }

    state.currentConversationId =
      data.currentConversationId || null;

    state.currentProjectId =
      data.currentProjectId || null;

  } catch (error) {
    console.warn("Lunex load error:", error);
  }
}

/* =========================================================
   UTILITIES
========================================================= */

function id(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatText(value) {
  return escapeHTML(value)
    .replace(/\n/g, "<br>");
}

function now() {
  return new Date().toISOString();
}

/* =========================================================
   ICONS
========================================================= */

function renderIcons(root = document) {

  root
    .querySelectorAll("[data-icon]")
    .forEach((element) => {

      const name =
        element.dataset.icon;

      if (
        window.LunexIcons &&
        window.LunexIcons.icon
      ) {
        element.innerHTML =
          window.LunexIcons.icon(name);
      }
    });
}

/* =========================================================
   NAVIGATION
========================================================= */

const PAGE_NAMES = {
  chat: "الدردشة",
  projects: "المشاريع",
  project: "المشروع",
  designer: "مصمم الواجهات",
  settings: "الإعدادات"
};

function showPage(page) {

  $$(".page").forEach((element) => {
    element.classList.remove("active");
  });

  const target =
    $(`#page-${page}`);

  if (!target) return;

  target.classList.add("active");

  $$(".nav-item[data-page]").forEach((item) => {
    item.classList.toggle(
      "active",
      item.dataset.page === page
    );
  });

  $("#pageTitle").textContent =
    PAGE_NAMES[page] || "Lunex";

  closeMobileSidebar();
}

$$(".nav-item[data-page]").forEach((button) => {

  button.addEventListener("click", () => {

    const page =
      button.dataset.page;

    if (page === "projects") {
      renderProjects();
    }

    showPage(page);
  });

});

/* =========================================================
   MOBILE SIDEBAR
========================================================= */

function openMobileSidebar() {
  $("#sidebar")?.classList.add("open");
  $("#sidebarOverlay")?.classList.add("open");
}

function closeMobileSidebar() {
  $("#sidebar")?.classList.remove("open");
  $("#sidebarOverlay")?.classList.remove("open");
}

$("#mobileMenu")?.addEventListener(
  "click",
  openMobileSidebar
);

$("#mobileClose")?.addEventListener(
  "click",
  closeMobileSidebar
);

$("#sidebarOverlay")?.addEventListener(
  "click",
  closeMobileSidebar
);

/* =========================================================
   CONVERSATIONS
========================================================= */

function createConversation() {

  const conversation = {
    id: id("chat"),
    title: "محادثة جديدة",
    createdAt: now(),
    updatedAt: now(),
    messages: []
  };

  state.conversations.unshift(
    conversation
  );

  state.currentConversationId =
    conversation.id;

  saveState();
  renderConversations();
  renderCurrentConversation();
  showPage("chat");
}

function getCurrentConversation() {

  return state.conversations.find(
    (conversation) =>
      conversation.id ===
      state.currentConversationId
  );
}

function renderConversations() {

  const list =
    $("#conversationList");

  if (!list) return;

  if (!state.conversations.length) {

    list.innerHTML = `
      <div class="empty-state">
        لا توجد محادثات
      </div>
    `;

    return;
  }

  list.innerHTML =
    state.conversations
      .map((conversation) => {

        const active =
          conversation.id ===
          state.currentConversationId
            ? "active"
            : "";

        return `
          <button
            class="conversation-item ${active}"
            data-conversation-id="${escapeHTML(conversation.id)}"
          >

            <span class="conversation-item-title">
              ${escapeHTML(conversation.title)}
            </span>

          </button>
        `;
      })
      .join("");

  $$(".conversation-item").forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          state.currentConversationId =
            button.dataset.conversationId;

          saveState();
          renderConversations();
          renderCurrentConversation();

          showPage("chat");
        }
      );

    }
  );
}

function renderCurrentConversation() {

  const container =
    $("#chatMessages");

  if (!container) return;

  const conversation =
    getCurrentConversation();

  if (
    !conversation ||
    !conversation.messages.length
  ) {

    container.innerHTML = `
      <div class="welcome">

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

  container.innerHTML =
    conversation.messages
      .map((message) => {

        return `
          <div class="message ${message.role}">
            <div class="message-bubble">
              ${formatText(message.content)}
            </div>
          </div>
        `;
      })
      .join("");

  container.scrollTop =
    container.scrollHeight;
}

function addMessage(
  role,
  content
) {

  let conversation =
    getCurrentConversation();

  if (!conversation) {

    createConversation();

    conversation =
      getCurrentConversation();
  }

  conversation.messages.push({
    role,
    content,
    createdAt: now()
  });

  conversation.updatedAt =
    now();

  if (
    role === "user" &&
    conversation.title === "محادثة جديدة"
  ) {

    conversation.title =
      content
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 45) ||
      "محادثة جديدة";
  }

  saveState();
  renderConversations();
  renderCurrentConversation();
}

/* =========================================================
   CHAT
========================================================= */

async function sendChatMessage() {

  if (state.isSending) return;

  const input =
    $("#messageInput");

  const message =
    input.value.trim();

  if (!message) return;

  state.isSending = true;

  $("#sendButton").disabled = true;

  if (!state.currentConversationId) {
    createConversation();
  }

  const conversation =
    getCurrentConversation();

  const history =
    conversation?.messages || [];

  addMessage(
    "user",
    message
  );

  input.value = "";
  autoResize(input);

  const loadingId =
    id("loading");

  appendLoadingMessage(
    loadingId
  );

  try {

    const response =
      await fetch("/api/chat", {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          message,
          history
        })
      });

    const data =
      await response.json();

    removeLoadingMessage(
      loadingId
    );

    if (!response.ok || !data.ok) {

      throw new Error(
        data.error ||
        "تعذر إكمال الطلب."
      );
    }

    addMessage(
      "assistant",
      data.reply
    );

  } catch (error) {

    removeLoadingMessage(
      loadingId
    );

    addMessage(
      "assistant",
      `تعذر إكمال الطلب.\n\n${error.message}`
    );

  } finally {

    state.isSending = false;

    $("#sendButton").disabled =
      false;

    input.focus();
  }
}

function appendLoadingMessage(
  loadingId
) {

  const container =
    $("#chatMessages");

  const element =
    document.createElement("div");

  element.className =
    "message assistant";

  element.id =
    loadingId;

  element.innerHTML = `
    <div class="message-bubble">
      جاري التفكير...
    </div>
  `;

  container.appendChild(
    element
  );

  container.scrollTop =
    container.scrollHeight;
}

function removeLoadingMessage(
  loadingId
) {

  document
    .getElementById(loadingId)
    ?.remove();
}

$("#chatForm")?.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();
    sendChatMessage();
  }
);

$("#messageInput")?.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();
      sendChatMessage();
    }

  }
);

/* =========================================================
   TEXTAREA AUTO RESIZE
========================================================= */

function autoResize(element) {

  if (!element) return;

  element.style.height = "auto";

  element.style.height =
    Math.min(
      element.scrollHeight,
      180
    ) + "px";
}

$("#messageInput")?.addEventListener(
  "input",
  (event) => {
    autoResize(event.target);
  }
);

$("#projectChatInput")?.addEventListener(
  "input",
  (event) => {
    autoResize(event.target);
  }
);

$("#designerInput")?.addEventListener(
  "input",
  (event) => {
    autoResize(event.target);
  }
);

/* =========================================================
   FILE UPLOAD
========================================================= */

$("#attachButton")?.addEventListener(
  "click",
  () => {
    $("#fileInput")?.click();
  }
);

$("#fileInput")?.addEventListener(
  "change",
  (event) => {

    const files =
      [...event.target.files];

    state.attachments =
      files.slice(0, 8);

    renderAttachments();
  }
);

function renderAttachments() {

  const container =
    $("#attachmentPreview");

  if (!container) return;

  container.innerHTML =
    state.attachments
      .map((file, index) => {

        return `
          <div class="attachment">

            <span
              class="attachment-name"
              title="${escapeHTML(file.name)}"
            >
              ${escapeHTML(file.name)}
            </span>

            <button
              type="button"
              class="attachment-remove"
              data-file-index="${index}"
            >
              ×
            </button>

          </div>
        `;
      })
      .join("");

  $$(".attachment-remove")
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          const index =
            Number(
              button.dataset.fileIndex
            );

          state.attachments.splice(
            index,
            1
          );

          renderAttachments();
        }
      );

    });
}

/* =========================================================
   PROJECTS
========================================================= */

function createProject(
  name
) {

  const project = {

    id: id("project"),

    name:
      name.trim(),

    createdAt: now(),

    updatedAt: now(),

    code: "",

    errors: [],

    chat: []
  };

  state.projects.unshift(
    project
  );

  state.currentProjectId =
    project.id;

  saveState();

  return project;
}

function getCurrentProject() {

  return state.projects.find(
    (project) =>
      project.id ===
      state.currentProjectId
  );
}

function renderProjects() {

  const list =
    $("#projectList");

  if (!list) return;

  if (!state.projects.length) {

    list.innerHTML = `
      <div class="empty-state">
        لا توجد مشاريع حتى الآن.
      </div>
    `;

    return;
  }

  list.innerHTML =
    state.projects
      .map((project) => {

        return `
          <button
            class="project-card"
            data-project-id="${escapeHTML(project.id)}"
          >

            <div>
              <div class="project-card-title">
                ${escapeHTML(project.name)}
              </div>

              <div class="project-card-meta">
                مشروع Luau
              </div>
            </div>

            <div class="project-card-meta">
              فتح المشروع
            </div>

          </button>
        `;
      })
      .join("");

  $$(".project-card").forEach(
    (card) => {

      card.addEventListener(
        "click",
        () => {

          openProject(
            card.dataset.projectId
          );

        }
      );

    }
  );
}

function openProject(
  projectId
) {

  state.currentProjectId =
    projectId;

  const project =
    getCurrentProject();

  if (!project) return;

  saveState();

  $("#workspaceProjectName")
    .textContent =
    project.name;

  $("#codeEditor").value =
    project.code || "";

  renderErrors();

  renderProjectChat();

  switchWorkspace(
    "editor"
  );

  showPage("project");
}

function switchWorkspace(
  workspace
) {

  $$(".workspace-tab")
    .forEach((tab) => {

      tab.classList.toggle(
        "active",
        tab.dataset.workspace ===
          workspace
      );

    });

  $$(".workspace-panel")
    .forEach((panel) => {

      panel.classList.remove(
        "active"
      );

    });

  const panel =
    $(`#workspace-${workspace}`);

  panel?.classList.add(
    "active"
  );
}

$$(".workspace-tab")
  .forEach((tab) => {

    tab.addEventListener(
      "click",
      () => {

        switchWorkspace(
          tab.dataset.workspace
        );

      }
    );

  });

/* =========================================================
   PROJECT MODAL
========================================================= */

function openProjectModal() {

  $("#projectModal")
    ?.classList.remove(
      "hidden"
    );

  $("#projectNameInput")
    ?.focus();
}

function closeProjectModal() {

  $("#projectModal")
    ?.classList.add(
      "hidden"
    );

  if ($("#projectNameInput")) {
    $("#projectNameInput").value =
      "";
  }
}

$("#createProjectButton")
  ?.addEventListener(
    "click",
    openProjectModal
  );

$("#closeProjectModal")
  ?.addEventListener(
    "click",
    closeProjectModal
  );

$("#confirmCreateProject")
  ?.addEventListener(
    "click",
    () => {

      const input =
        $("#projectNameInput");

      const name =
        input.value.trim();

      if (!name) {
        input.focus();
        return;
      }

      const project =
        createProject(name);

      closeProjectModal();

      renderProjects();

      openProject(
        project.id
      );
    }
  );

$("#projectNameInput")
  ?.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Enter"
      ) {

        event.preventDefault();

        $("#confirmCreateProject")
          ?.click();
      }

    }
  );

$("#projectModal")
  ?.addEventListener(
    "click",
    (event) => {

      if (
        event.target ===
        $("#projectModal")
      ) {
        closeProjectModal();
      }

    }
  );

$("#backToProjects")
  ?.addEventListener(
    "click",
    () => {

      renderProjects();
      showPage("projects");

    }
  );

/* =========================================================
   CODE EDITOR
========================================================= */

$("#codeEditor")
  ?.addEventListener(
    "input",
    (event) => {

      const project =
        getCurrentProject();

      if (!project) return;

      project.code =
        event.target.value;

      project.updatedAt =
        now();

      saveState();
    }
  );

/* =========================================================
   LUau ANALYZER
========================================================= */

async function analyzeCode() {

  if (state.isAnalyzing) return;

  const project =
    getCurrentProject();

  if (!project) return;

  const code =
    $("#codeEditor")
      .value;

  if (!code.trim()) {

    $("#analyzerStatus")
      .textContent =
      "اكتب كود Luau أولًا.";

    return;
  }

  state.isAnalyzing =
    true;

  $("#analyzeCodeButton")
    .disabled = true;

  $("#analyzerStatus")
    .textContent =
    "جاري الفحص...";

  switchWorkspace(
    "errors"
  );

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

    if (
      !response.ok ||
      !data.ok
    ) {
      throw new Error(
        data.error ||
        "تعذر فحص الكود."
      );
    }

    project.errors =
      parseAnalyzerResult(
        data.report
      );

    project.updatedAt =
      now();

    saveState();

    renderErrors();

    $("#analyzerStatus")
      .textContent =
      "اكتمل الفحص.";

  } catch (error) {

    project.errors = [
      {
        severity: "error",
        title: "تعذر إكمال الفحص",
        line: "-",
        message: error.message
      }
    ];

    renderErrors();

    $("#analyzerStatus")
      .textContent =
      "حدث خطأ أثناء الفحص.";

  } finally {

    state.isAnalyzing =
      false;

    $("#analyzeCodeButton")
      .disabled = false;
  }
}

$("#analyzeCodeButton")
  ?.addEventListener(
    "click",
    analyzeCode
  );

/* =========================================================
   PARSE AI REPORT
========================================================= */

function parseAnalyzerResult(
  report
) {

  const text =
    String(report || "")
      .trim();

  if (!text) {
    return [];
  }

  /*
   * Try to identify numbered issues.
   */

  const blocks =
    text
      .split(
        /\n(?=(?:\d+[\).\-\:]|[-*])\s*)/
      )
      .map(
        (item) => item.trim()
      )
      .filter(Boolean);

  const issues = [];

  for (
    const block of blocks
  ) {

    const lower =
      block.toLowerCase();

    let severity =
      "error";

    if (
      lower.includes("warning") ||
      lower.includes("تحذير")
    ) {
      severity =
        "warning";
    }

    if (
      lower.includes("suggestion") ||
      lower.includes("اقتراح")
    ) {
      severity =
        "suggestion";
    }

    const lineMatch =
      block.match(
        /(?:line|السطر)\s*[:#-]?\s*(\d+)/i
      );

    issues.push({
      severity,
      title:
        block
          .split("\n")[0]
          .slice(0, 150),

      line:
        lineMatch
          ? lineMatch[1]
          : "-",

      message:
        block
    });
  }

  /*
   * If Claude returned one normal paragraph,
   * keep it as one result instead of losing it.
   */

  if (!issues.length) {

    issues.push({
      severity: "error",
      title: "نتيجة الفحص",
      line: "-",
      message: text
    });
  }

  return issues;
}

/* =========================================================
   RENDER ERRORS
========================================================= */

function renderErrors() {

  const container =
    $("#errorResults");

  const project =
    getCurrentProject();

  if (!container) return;

  if (
    !project ||
    !project.errors ||
    !project.errors.length
  ) {

    container.innerHTML = `
      <div class="empty-state">
        لا توجد نتائج فحص حتى الآن.
      </div>
    `;

    return;
  }

  container.innerHTML =
    project.errors
      .map((error, index) => {

        const title =
          error.title ||
          `خطأ ${index + 1}`;

        const line =
          error.line || "-";

        const message =
          error.message ||
          "";

        return `
          <article class="error-card">

            <div class="error-card-title">
              ${escapeHTML(title)}
            </div>

            <div class="error-card-line">
              ${escapeHTML(
                error.severity || "error"
              )}
              ·
              السطر:
              ${escapeHTML(line)}
            </div>

            <div class="error-card-text">
              ${formatText(message)}
            </div>

          </article>
        `;

      })
      .join("");
}

$("#copyErrorsButton")
  ?.addEventListener(
    "click",
    async () => {

      const project =
        getCurrentProject();

      if (
        !project ||
        !project.errors?.length
      ) {
        return;
      }

      const text =
        project.errors
          .map(
            (error, index) =>
              `${index + 1}. ${
                error.title || "خطأ"
              }
السطر: ${
                error.line || "-"
              }
النوع: ${
                error.severity || "error"
              }
${error.message || ""}`
          )
          .join("\n\n");

      try {

        await navigator.clipboard
          .writeText(text);

        $("#copyErrorsButton")
          .querySelector("span")
          ?.classList.add("copied");

      } catch {
        console.warn(
          "Clipboard unavailable"
        );
      }
    }
  );

/* =========================================================
   PROJECT CHAT
========================================================= */

function renderProjectChat() {

  const container =
    $("#projectChatMessages");

  const project =
    getCurrentProject();

  if (!container || !project) {
    return;
  }

  if (!project.chat.length) {

    container.innerHTML = `
      <div class="empty-state">
        اسأل Lunex عن أي شيء متعلق بمشروعك.
      </div>
    `;

    return;
  }

  container.innerHTML =
    project.chat
      .map((message) => {

        return `
          <div class="message ${message.role}">
            <div class="message-bubble">
              ${formatText(message.content)}
            </div>
          </div>
        `;

      })
      .join("");

  container.scrollTop =
    container.scrollHeight;
}

$("#projectChatForm")
  ?.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      const input =
        $("#projectChatInput");

      const message =
        input.value.trim();

      if (!message) return;

      const project =
        getCurrentProject();

      if (!project) return;

      project.chat.push({
        role: "user",
        content: message
      });

      input.value = "";

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
                message,
                history:
                  project.chat
              })
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.ok
        ) {
          throw new Error(
            data.error ||
            "تعذر إكمال الطلب."
          );
        }

        project.chat.push({
          role: "assistant",
          content: data.reply
        });

        project.updatedAt =
          now();

        saveState();

        renderProjectChat();

      } catch (error) {

        project.chat.push({
          role: "assistant",
          content:
            `تعذر إكمال الطلب.\n\n${error.message}`
        });

        renderProjectChat();
      }

    }
  );

/* =========================================================
   UI DESIGNER
========================================================= */

$("#designerForm")
  ?.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      const input =
        $("#designerInput");

      const result =
        $("#designerResult");

      const request =
        input.value.trim();

      if (!request) return;

      result.textContent =
        "جاري إنشاء التصميم...";

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

        if (
          !response.ok ||
          !data.ok
        ) {
          throw new Error(
            data.error ||
            "تعذر إنشاء التصميم."
          );
        }

        result.textContent =
          data.design;

      } catch (error) {

        result.textContent =
          `تعذر إنشاء التصميم.\n\n${error.message}`;
      }

    }
  );

/* =========================================================
   NEW CHAT
========================================================= */

$("#newChatButton")
  ?.addEventListener(
    "click",
    () => {

      createConversation();

    }
  );

/* =========================================================
   INITIALIZE
========================================================= */

function initialize() {

  loadState();

  renderIcons();

  renderConversations();

  renderProjects();

  if (
    state.currentConversationId &&
    state.conversations.some(
      (conversation) =>
        conversation.id ===
        state.currentConversationId
    )
  ) {

    renderCurrentConversation();

  } else {

    state.currentConversationId =
      null;

    renderCurrentConversation();
  }

  if (
    state.currentProjectId &&
    state.projects.some(
      (project) =>
        project.id ===
        state.currentProjectId
    )
  ) {

    const project =
      getCurrentProject();

    if (project) {

      $("#workspaceProjectName")
        .textContent =
        project.name;

      $("#codeEditor").value =
        project.code || "";

      renderErrors();
      renderProjectChat();
    }
  }

  showPage("chat");
}

initialize();