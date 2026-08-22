"use strict";

/*
  LUNEX ICON SYSTEM
  SVG icons — no images, no emoji
*/

const LunexIcons = Object.freeze({

  sparkles: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z"/>
      <path d="M19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/>
    </svg>
  `,

  send: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round" stroke-linejoin="round">
      <path d="M21.5 2.5L10.2 13.8"/>
      <path d="M21.5 2.5L14.3 21.5L10.2 13.8L2.5 10.2L21.5 2.5Z"/>
    </svg>
  `,

  upload: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 16V4"/>
      <path d="M7.5 8.5L12 4l4.5 4.5"/>
      <path d="M4 14v4.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V14"/>
    </svg>
  `,

  paperclip: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 11.5l-8.7 8.7a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.6-8.6"/>
    </svg>
  `,

  clipboard: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round" stroke-linejoin="round">
      <rect x="6" y="5" width="13" height="16" rx="2"/>
      <path d="M9 5.5V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5"/>
      <path d="M9.5 11h6"/>
      <path d="M9.5 15h4"/>
    </svg>
  `,

  copy: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round" stroke-linejoin="round">
      <rect x="8" y="8" width="12" height="12" rx="2"/>
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>
    </svg>
  `,

  search: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round">
      <circle cx="10.8" cy="10.8" r="6.5"/>
      <path d="M16 16l5 5"/>
    </svg>
  `,

  bell: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round">
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/>
      <path d="M10 21h4"/>
    </svg>
  `,

  settings: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.7"
      stroke-linecap="round"
      stroke-linejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.1h-2.5v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H4.4v-2.5h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5h2.5v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1v2.5h-.1a1.7 1.7 0 0 0-1.6 1Z"/>
    </svg>
  `,

  code: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round">
      <path d="M8 9l-4 3 4 3"/>
      <path d="M16 9l4 3-4 3"/>
      <path d="M14 5l-4 14"/>
    </svg>
  `,

  file: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round">
      <path d="M6 3h8l5 5v13H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/>
      <path d="M14 3v6h5"/>
      <path d="M8 13h8"/>
      <path d="M8 17h6"/>
    </svg>
  `,

  folder: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round">
      <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H10l2 2h6.5A2.5 2.5 0 0 1 21 8.5v9A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-11Z"/>
    </svg>
  `,

  shield: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round">
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z"/>
      <path d="M9 12l2 2 4-5"/>
    </svg>
  `,

  play: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round">
      <path d="M7 4.5v15l12-7.5-12-7.5Z"/>
    </svg>
  `,

  stop: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round">
      <rect x="6" y="6" width="12" height="12" rx="2"/>
    </svg>
  `,

  plus: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.9"
      stroke-linecap="round">
      <path d="M12 5v14"/>
      <path d="M5 12h14"/>
    </svg>
  `,

  close: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.9"
      stroke-linecap="round">
      <path d="M6 6l12 12"/>
      <path d="M18 6L6 18"/>
    </svg>
  `,

  menu: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round">
      <path d="M4 6h16"/>
      <path d="M4 12h16"/>
      <path d="M4 18h16"/>
    </svg>
  `,

  refresh: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round">
      <path d="M20 11a8 8 0 0 0-14.7-4L4 9"/>
      <path d="M4 4v5h5"/>
      <path d="M4 13a8 8 0 0 0 14.7 4L20 15"/>
      <path d="M20 20v-5h-5"/>
    </svg>
  `,

  trash: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round">
      <path d="M4 7h16"/>
      <path d="M9 7V4h6v3"/>
      <path d="M7 7l1 14h8l1-14"/>
      <path d="M10 11v6"/>
      <path d="M14 11v6"/>
    </svg>
  `,

  edit: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round">
      <path d="M4 20l4.2-1 10.6-10.6a2.2 2.2 0 0 0-3.1-3.1L5.1 15.9 4 20Z"/>
      <path d="M13.8 6.2l4 4"/>
    </svg>
  `,

  check: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round">
      <path d="M5 12l4 4L19 6"/>
    </svg>
  `,

  chevronDown: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round">
      <path d="M6 9l6 6 6-6"/>
    </svg>
  `,

  chevronLeft: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round">
      <path d="M15 6l-6 6 6 6"/>
    </svg>
  `,

  external: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round">
      <path d="M14 5h5v5"/>
      <path d="M19 5l-9 9"/>
      <path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"/>
    </svg>
  `,

  user: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round">
      <circle cx="12" cy="8" r="3.2"/>
      <path d="M5.5 20c.8-4 3-6 6.5-6s5.7 2 6.5 6"/>
    </svg>
  `,

  home: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round">
      <path d="M4 10.5L12 4l8 6.5"/>
      <path d="M6 9v11h12V9"/>
      <path d="M10 20v-5h4v5"/>
    </svg>
  `,

  monitor: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round">
      <rect x="3" y="4" width="18" height="13" rx="2"/>
      <path d="M8 21h8"/>
      <path d="M12 17v4"/>
    </svg>
  `,

  database: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round">
      <ellipse cx="12" cy="5" rx="7" ry="3"/>
      <path d="M5 5v7c0 1.7 3.1 3 7 3s7-1.3 7-3V5"/>
      <path d="M5 12v7c0 1.7 3.1 3 7 3s7-1.3 7-3v-7"/>
    </svg>
  `,

  link: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round">
      <path d="M10 13.5a4 4 0 0 0 5.7.1l2.2-2.2a4 4 0 0 0-5.7-5.7l-1.3 1.3"/>
      <path d="M14 10.5a4 4 0 0 0-5.7-.1l-2.2 2.2a4 4 0 0 0 5.7 5.7l1.3-1.3"/>
    </svg>
  `,

  terminal: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2"/>
      <path d="M7 9l3 3-3 3"/>
      <path d="M13 15h4"/>
    </svg>
  `,

  warning: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round">
      <path d="M12 4l9 16H3L12 4Z"/>
      <path d="M12 9v5"/>
      <path d="M12 17.5v.1"/>
    </svg>
  `,

  info: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 10v6"/>
      <path d="M12 7.5v.1"/>
    </svg>
  `,

  bolt: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round">
      <path d="M13 2L5 13h6l-1 9 8-11h-6l1-9Z"/>
    </svg>
  `

});


/* =========================================================
   ICON HELPER
========================================================= */

function lunexIcon(name, size = 18, className = "") {

  const svg = LunexIcons[name];

  if (!svg) {
    console.warn(`[LunexIcons] Unknown icon: ${name}`);
    return "";
  }

  return svg
    .replace(
      "<svg ",
      `<svg class="${className}" width="${size}" height="${size}" `
    );
}


/* =========================================================
   GLOBAL ACCESS
========================================================= */

window.LunexIcons = LunexIcons;
window.lunexIcon = lunexIcon;