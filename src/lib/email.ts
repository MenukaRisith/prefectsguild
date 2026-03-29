import nodemailer from "nodemailer";
import { env, isSmtpConfigured } from "@/lib/env";

function createTransport() {
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  if (!isSmtpConfigured) {
    console.info(`SMTP not configured. Email skipped for ${options.to}.`);
    return false;
  }

  const transport = createTransport();

  await transport.sendMail({
    from: env.SMTP_FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });

  return true;
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  return sendEmail({
    to,
    subject: "Reset your KCC Prefects Guild password",
    html: `<p>A password reset was requested for your account.</p><p><a href="${resetUrl}">Reset password</a></p>`,
    text: `Reset your password: ${resetUrl}`,
  });
}

export async function sendReminderEmail(to: string, title: string, message: string) {
  return sendEmail({
    to,
    subject: title,
    html: `<p>${message}</p>`,
    text: message,
  });
}
