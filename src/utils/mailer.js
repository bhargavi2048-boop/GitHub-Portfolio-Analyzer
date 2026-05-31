// Email helper. No-op if SMTP not configured (logs to console instead).
const logger = require("./logger");

let transporterPromise = null;

async function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  if (!transporterPromise) {
    transporterPromise = (async () => {
      const nodemailer = require("nodemailer");
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
    })();
  }
  return transporterPromise;
}

async function sendMail({ to, subject, html, text }) {
  const t = await getTransporter();
  const from = process.env.EMAIL_FROM || "no-reply@example.com";
  if (!t) {
    logger.info("[email:dev-mode]", { to, subject, text: text || html });
    return { dev: true };
  }
  return t.sendMail({ from, to, subject, html, text });
}

module.exports = { sendMail };
