"use strict";

/* =========================================================
   LUNEX — FRONTEND APPLICATION
========================================================= */

const state = {
  busy: false,
  messages: [],
  controller: null
};

/* =========================================================
   DOM
========================================================= */

const chat = document.getElementById("chat");
const welcome = document.getElementById("welcome");
const composer = document.getElementById("composer");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const newChatButton = document.getElementById("newChatButton");
const mobileMenuButton = document.getElementById("mobileMenuButton");
const sidebar = document.getElementById("sidebar");
const settingsButton = document.getElementById("settingsButton");

/* =========================================================
   UTILITIES
========================================================= */

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function scrollToBottom(smooth = true) {
  requestAnimationFrame(() => {
    chat.scrollTo({
      top: chat.scrollHeight,
      behavior: smooth ? "smooth" : "auto"
    });
  });
}

function autoResizeTextarea() {
  messageInput.style.height = "auto";

  const height = Math.min(
    messageInput.scrollHeight,
    190
  );

  messageInput.style.height = `${height}px`;
}

function setBusy(value) {
  state.busy = value;

  sendButton.disabled = value;
  messageInput.disabled = value;

  if (value) {
    sendButton.setAttribute("aria-label", "إيقاف");
  } else {
    sendButton.setAttribute("aria-label", "إرسال");
  }
}

/* =========================================================
   MESSAGE UI
========================================================= */

function createAvatar(type) {
  const avatar = document.createElement("div");

  avatar.className = "message-avatar";

  if (type === "user") {
    avatar.innerHTML = `
      <svg
        viewBox="0 0 24 24"
        width="17"
        height="17"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
      >
        <circle cx="12" cy="8" r="3.2"/>
        <path d="M5.5 20c.8-4 3-6 6.5-6s5.7 2 6.5 6"/>
      </svg>
    `;
  } else {
    avatar.innerHTML = `
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linejoin="round"
      >
        <path d="M12 3l2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3Z"/>
        <circle cx="12" cy="12" r="1.6" fill="currentColor"/>
      </svg>
    `;
  }

  return avatar;
}

function addMessage(role, text) {
  const message = document.createElement("article");

  message.className = `message ${role}`;

  const avatar = createAvatar(role);

  const content = document.createElement("div");

  content.className = "message-content";

  content.textContent = text;

  message.appendChild(avatar);
  message.appendChild(content);

  chat.appendChild(message);

  state.messages.push({
    role,
    content: text
  });

  scrollToBottom();

  return message;
}

/* =========================================================
   TYPING INDICATOR
========================================================= */

function createTypingMessage() {
  const message = document.createElement("article");

  message.className = "message ai";
  message.dataset.typing = "true";

  const avatar = createAvatar("ai");

  const content = document.createElement("div");

  content.className = "message-content";

  content.innerHTML = `
    <div class="typing-indicator" aria-label="Lunex يكتب">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;

  message.appendChild(avatar);
  message.appendChild(content);

  chat.appendChild(message);

  scrollToBottom();

  return message;
}

/* =========================================================
   WELCOME
========================================================= */

function hideWelcome() {
  if (!welcome) return;

  welcome.style.display = "none";
}

function showWelcome() {
  if (!welcome) return;

  welcome.style.display = "";
}

/* =========================================================
   SEND MESSAGE
========================================================= */

async function sendMessage(message) {
  const cleanMessage = message.trim();

  if (!cleanMessage || state.busy) {
    return;
  }

  hideWelcome();

  addMessage("user", cleanMessage);

  messageInput.value = "";

  autoResizeTextarea();

  setBusy(true);

  const typingMessage = createTypingMessage();

  state.controller = new AbortController();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        message: cleanMessage
      }),

      signal: state.controller.signal
    });

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error(
        "الخادم أعاد استجابة غير صالحة."
      );
    }

    typingMessage.remove();

    if (!response.ok) {
      throw new Error(
        data?.error ||
        "حدث خطأ أثناء الاتصال بالخادم."
      );
    }

    const reply =
      typeof data?.reply === "string"
        ? data.reply
        : "لم تصل استجابة صالحة من Lunex.";

    addMessage("ai", reply);

  } catch (error) {

    typingMessage.remove();

    if (error.name === "AbortError") {
      addMessage(
        "ai",
        "تم إيقاف الطلب."
      );
    } else {
      console.error("LUNEX_CHAT_ERROR:", error);

      addMessage(
        "ai",
        `تعذر إكمال الطلب.\n\n${error.message}`
      );
    }

  } finally {
    state.controller = null;

    setBusy(false);

    messageInput.focus();
  }
}

/* =========================================================
   COMPOSER
========================================================= */

composer?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (state.busy) {
    return;
  }

  sendMessage(messageInput.value);
});

messageInput?.addEventListener("input", () => {
  autoResizeTextarea();
});

messageInput?.addEventListener("keydown", (event) => {

  if (event.key !== "Enter") {
    return;
  }

  if (event.shiftKey) {
    return;
  }

  event.preventDefault();

  if (!state.busy) {
    composer.requestSubmit();
  }
});

/* =========================================================
   SUGGESTIONS
========================================================= */

document.querySelectorAll(".suggestion").forEach((button) => {

  button.addEventListener("click", () => {

    const prompt =
      button.dataset.prompt || "";

    if (!prompt) {
      return;
    }

    messageInput.value = prompt;

    autoResizeTextarea();

    messageInput.focus();

    composer.requestSubmit();
  });

});

/* =========================================================
   NEW CHAT
========================================================= */

newChatButton?.addEventListener("click", () => {

  if (state.busy && state.controller) {
    state.controller.abort();
  }

  state.messages = [];

  chat
    .querySelectorAll(".message")
    .forEach((message) => {
      message.remove();
    });

  showWelcome();

  messageInput.value = "";

  autoResizeTextarea();

  setBusy(false);

  messageInput.focus();
});

/* =========================================================
   MOBILE SIDEBAR
========================================================= */

mobileMenuButton?.addEventListener("click", () => {

  sidebar?.classList.toggle("open");

});

document.querySelectorAll(".nav-button").forEach((button) => {

  button.addEventListener("click", () => {

    document
      .querySelectorAll(".nav-button")
      .forEach((item) => {
        item.classList.remove("active");
      });

    button.classList.add("active");

    if (window.innerWidth <= 700) {
      sidebar?.classList.remove("open");
    }

  });

});

/* =========================================================
   SETTINGS
========================================================= */

settingsButton?.addEventListener("click", () => {

  addMessage(
    "ai",
    "الإعدادات ستكون متاحة في لوحة Lunex القادمة."
  );

  hideWelcome();

});

/* =========================================================
   CLOSE SIDEBAR WHEN CLICKING OUTSIDE
========================================================= */

document.addEventListener("click", (event) => {

  if (window.innerWidth > 700) {
    return;
  }

  if (!sidebar?.classList.contains("open")) {
    return;
  }

  const insideSidebar =
    sidebar.contains(event.target);

  const menuButton =
    mobileMenuButton?.contains(event.target);

  if (!insideSidebar && !menuButton) {
    sidebar.classList.remove("open");
  }

});

/* =========================================================
   HEALTH CHECK
========================================================= */

async function checkServer() {

  try {

    const response =
      await fetch("/api/health", {
        method: "GET",
        cache: "no-store"
      });

    if (!response.ok) {
      throw new Error("Server unavailable");
    }

    const data = await response.json();

    console.log(
      `[Lunex] ${data.name} — ${data.service}`
    );

  } catch (error) {

    console.warn(
      "[Lunex] Backend health check failed."
    );

  }

}

/* =========================================================
   INITIALIZE
========================================================= */

function initialize() {

  autoResizeTextarea();

  messageInput?.focus();

  checkServer();

  console.log(
    "%cLunex",
    "font-size:24px;font-weight:700;"
  );

  console.log(
    "AI Engineering Studio initialized."
  );
}

initialize();