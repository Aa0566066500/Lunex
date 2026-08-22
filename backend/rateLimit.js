"use strict";

const rateLimit = require("express-rate-limit");

/*
 * حماية عامة للـ API
 * تمنع إرسال عدد ضخم من الطلبات خلال وقت قصير.
 */

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,

  max: 30,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    ok: false,
    error: "طلبات كثيرة. انتظر قليلًا ثم حاول مرة أخرى."
  }
});

module.exports = {
  apiLimiter
};