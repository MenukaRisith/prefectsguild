import nodemailer from "nodemailer";
import { getSmtpRuntimeConfig } from "@/lib/system-settings";

function createTransport(smtp: Awaited<ReturnType<typeof getSmtpRuntimeConfig>>) {
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const smtp = await getSmtpRuntimeConfig();

  if (!smtp.configured) {
    console.info(`SMTP not configured. Email skipped for ${options.to}.`);
    return false;
  }

  const transport = createTransport(smtp);

  await transport.sendMail({
    from: smtp.from,
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
