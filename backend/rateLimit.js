"use strict";

const requests = new Map();

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 20;

function getClientKey(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

function rateLimit(req, res, next) {
  const key = getClientKey(req);
  const now = Date.now();

  const current = requests.get(key);

  if (!current || now - current.start >= WINDOW_MS) {
    requests.set(key, {
      start: now,
      count: 1
    });

    return next();
  }

  current.count++;

  if (current.count > MAX_REQUESTS) {
    return res.status(429).json({
      error: "طلبات كثيرة. حاول مرة أخرى بعد قليل."
    });
  }

  next();
}

setInterval(() => {
  const now = Date.now();

  for (const [key, value] of requests) {
    if (now - value.start >= WINDOW_MS) {
      requests.delete(key);
    }
  }
}, WINDOW_MS).unref();

module.exports = rateLimit;