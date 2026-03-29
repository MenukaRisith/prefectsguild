import { createHash, randomBytes } from "node:crypto";
import { addDays } from "date-fns";
import type {
  AttendanceScanStatus,
  EventAudience,
  ReminderChannel,
} from "@prisma/client";
import {
  AccountStatus,
  AbsenceStatus,
  AnnouncementAudience,
  AttendanceSource,
  ReminderStatus,
  Role,
} from "@prisma/client";
import { getAttendanceScanWindow } from "@/lib/attendance-windows";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { toDayKey } from "@/lib/date";
import { buildPrefectIdentifier, createQrDataUrl, signQrToken, verifyQrToken } from "@/lib/qr";
import { buildPrefectPassPdf } from "@/lib/pdf";
import { attendanceWarningMessage } from "@/lib/constants";
import { sendReminderEmail } from "@/lib/email";
import { getSystemSettings } from "@/lib/system-settings";

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function ensureQrPassForUser(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      prefectProfile: true,
      qrPass: true,
    },
  });

  if (!user || !user.prefectProfile) {
    throw new Error("Prefect profile not found.");
  }

  let prefectIdentifier = user.prefectProfile.prefectIdentifier;

  if (!prefectIdentifier) {
    prefectIdentifier = buildPrefectIdentifier(
      user.prefectProfile.appointedYear,
      user.prefectProfile.id,
    );

    await db.prefectProfile.update({
      where: { id: user.prefectProfile.id },
      data: { prefectIdentifier },
    });
  }

  const qrPass =
    user.qrPass ??
    (await db.qRPass.create({
      data: {
        userId: user.id,
        prefectIdentifier,
      },
    }));

  return {
    user,
    qrPass,
    prefectIdentifier,
  };
}

export async function buildQrPassBundle(userId: string) {
  const { user, qrPass, prefectIdentifier } = await ensureQrPassForUser(userId);
  const token = await signQrToken(user.id, {
    prefectId: prefectIdentifier,
    tokenVersion: qrPass.tokenVersion,
  });
  const qrDataUrl = await createQrDataUrl(token);
  const qrPngBytes = Buffer.from(qrDataUrl.split(",")[1] ?? "", "base64");
  const pdfBytes = await buildPrefectPassPdf({
    fullName: user.fullName,
    displayName: user.prefectProfile?.displayName ?? user.fullName,
    grade: user.prefectProfile?.grade ?? 0,
    prefectIdentifier,
    qrPngBytes,
  });

  await db.qRPass.update({
    where: { id: qrPass.id },
    data: {
      printedAt: new Date(),
    },
  });

  return { token, qrDataUrl, pdfBytes, qrPass, user };
}

export async function createReminder(input: {
  recipientId: string;
  title: string;
  message: string;
  dueAt: Date;
  channel?: ReminderChannel;
  taskId?: string;
  calendarEventId?: string;
  absenceRequestId?: string;
}) {
  return db.reminder.create({
    data: {
      recipientId: input.recipientId,
      title: input.title,
      message: input.message,
      dueAt: input.dueAt,
      channel: input.channel ?? "IN_APP",
      taskId: input.taskId,
      calendarEventId: input.calendarEventId,
      absenceRequestId: input.absenceRequestId,
    },
  });
}

async function getAudienceRecipients(audience: EventAudience) {
  if (audience === "STAFF_ONLY") {
    return db.user.findMany({
      where: {
        role: { in: [Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN] },
        status: AccountStatus.ACTIVE,
      },
      select: { id: true, email: true },
    });
  }

  return db.user.findMany({
    where: {
      role: Role.PREFECT,
      status: AccountStatus.ACTIVE,
    },
    select: { id: true, email: true },
  });
}

export async function queueTaskReminders(taskId: string) {
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      assignee: {
        select: { id: true, email: true, fullName: true },
      },
    },
  });

  if (!task || !task.dueAt) {
    return;
  }

  await db.reminder.createMany({
    data: [
      {
        recipientId: task.assigneeId,
        title: `Task due: ${task.title}`,
        message: `Your task "${task.title}" is due on ${task.dueAt.toLocaleString()}.`,
        dueAt: task.dueAt,
        channel: "IN_APP",
        taskId: task.id,
      },
      {
        recipientId: task.assigneeId,
        title: `Task due: ${task.title}`,
        message: `Your task "${task.title}" is due on ${task.dueAt.toLocaleString()}.`,
        dueAt: addDays(task.dueAt, 0),
        channel: "EMAIL",
        taskId: task.id,
      },
    ],
  });
}

export async function queueCalendarReminders(eventId: string) {
  const event = await db.calendarEvent.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    return;
  }

  const recipients = await getAudienceRecipients(event.audience);

  await db.reminder.createMany({
    data: recipients.flatMap((recipient) => [
      {
        recipientId: recipient.id,
        title: `Event: ${event.title}`,
        message: `${event.title} starts on ${event.eventDate.toLocaleString()}.`,
        dueAt: event.eventDate,
        channel: "IN_APP",
        calendarEventId: event.id,
      },
      {
        recipientId: recipient.id,
        title: `Event: ${event.title}`,
        message: `${event.title} starts on ${event.eventDate.toLocaleString()}.`,
        dueAt: event.eventDate,
        channel: "EMAIL",
        calendarEventId: event.id,
      },
    ]),
  });
}

export async function markReminderSent(reminderId: string, status: ReminderStatus) {
  return db.reminder.update({
    where: { id: reminderId },
    data: {
      status,
      sentAt: new Date(),
    },
  });
}

export async function runReminderDispatch() {
  const reminders = await db.reminder.findMany({
    where: {
      dueAt: { lte: new Date() },
      status: ReminderStatus.PENDING,
    },
    include: {
      recipient: {
        select: {
          email: true,
        },
      },
    },
    take: 50,
  });

  for (const reminder of reminders) {
    if (reminder.channel === "EMAIL") {
      try {
        await sendReminderEmail(reminder.recipient.email, reminder.title, reminder.message);
        await markReminderSent(reminder.id, ReminderStatus.SENT);
      } catch {
        await markReminderSent(reminder.id, ReminderStatus.FAILED);
      }
    } else {
      await markReminderSent(reminder.id, ReminderStatus.SENT);
    }
  }

  return reminders.length;
}

export async function runAttendanceAudit(date = new Date()) {
  const dayKey = toDayKey(date);
  const dayStart = new Date(`${dayKey}T00:00:00.000Z`);
  const dayEnd = new Date(`${dayKey}T23:59:59.999Z`);
  const activePrefects = await db.user.findMany({
    where: {
      role: Role.PREFECT,
      status: AccountStatus.ACTIVE,
    },
    select: {
      id: true,
      email: true,
    },
  });

  let createdWarnings = 0;

  for (const prefect of activePrefects) {
    const [attendance, approvedAbsence, existingReminder] = await Promise.all([
      db.attendanceRecord.findFirst({
        where: {
          userId: prefect.id,
          dayKey,
        },
      }),
      db.absenceRequest.findFirst({
        where: {
          userId: prefect.id,
          status: { in: [AbsenceStatus.APPROVED, AbsenceStatus.SUBMITTED] },
          startDate: { lte: dayEnd },
          endDate: { gte: dayStart },
        },
      }),
      db.reminder.findFirst({
        where: {
          recipientId: prefect.id,
          title: "Attendance reason required",
          dueAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      }),
    ]);

    if (!attendance && !approvedAbsence && !existingReminder) {
      await createReminder({
        recipientId: prefect.id,
        title: "Attendance reason required",
        message: attendanceWarningMessage,
        dueAt: new Date(),
      });
      createdWarnings += 1;
    }
  }

  return { dayKey, createdWarnings };
}

export async function scanAttendanceByToken(token: string, scannerLabel?: string) {
  const now = new Date();
  const dayKey = toDayKey(now);
  const settings = await getSystemSettings();
  const scanWindow = getAttendanceScanWindow(settings, now);

  if (scanWindow.mode === "closed") {
    await db.attendanceScanLog.create({
      data: {
        dayKey,
        scannerLabel,
        status: "OUTSIDE_WINDOW",
        message: scanWindow.message,
      },
    });

    return {
      status: "closed",
      mode: "closed",
      message: scanWindow.message,
      prefect: null,
    } as const;
  }

  try {
    const verified = await verifyQrToken(token);

    if (!verified.userId) {
      throw new Error("Missing user id.");
    }

    const qrPass = await db.qRPass.findFirst({
      where: {
        userId: verified.userId,
        prefectIdentifier: verified.prefectId,
        tokenVersion: verified.tokenVersion,
      },
      include: {
        user: {
          include: {
            prefectProfile: true,
          },
        },
      },
    });

    if (!qrPass || qrPass.user.status !== AccountStatus.ACTIVE) {
      throw new Error("QR pass is not active.");
    }

    const existing = await db.attendanceRecord.findFirst({
      where: {
        userId: qrPass.userId,
        dayKey,
      },
    });

    let status: AttendanceScanStatus = "ACCEPTED";
    let message = "Attendance marked successfully.";

    if (scanWindow.mode === "check_in") {
      if (existing) {
        status = "DUPLICATE";
        message = "Arrival was already recorded earlier today.";
      } else {
        await db.attendanceRecord.create({
          data: {
            userId: qrPass.userId,
            qrPassId: qrPass.id,
            dayKey,
            date: new Date(`${dayKey}T00:00:00.000Z`),
            scannedAt: now,
            source: AttendanceSource.QR_KIOSK,
          },
        });
      }
    } else if (!existing) {
      status = "INVALID";
      message = "Arrival must be recorded first before leaving can be marked.";
    } else if (existing.checkedOutAt) {
      status = "DUPLICATE";
      message = "Leaving was already recorded earlier today.";
    } else {
      message = "Leaving marked successfully.";
      await db.attendanceRecord.update({
        where: { id: existing.id },
        data: {
          checkedOutAt: now,
        },
      });
    }

    await db.attendanceScanLog.create({
      data: {
        userId: qrPass.userId,
        qrPassId: qrPass.id,
        dayKey,
        scannerLabel,
        status,
        message,
      },
    });

    return {
      status: status.toLowerCase(),
      mode: scanWindow.mode,
      message,
      prefect: {
        fullName: qrPass.user.fullName,
        displayName: qrPass.user.prefectProfile?.displayName ?? qrPass.user.fullName,
        prefectIdentifier: qrPass.prefectIdentifier,
      },
    } as const;
  } catch {
    await db.attendanceScanLog.create({
      data: {
        dayKey,
        scannerLabel,
        status: "INVALID",
        message: "Invalid QR token received.",
      },
    });

    return {
      status: "invalid",
      mode: scanWindow.mode,
      message: "This QR code is invalid or expired.",
      prefect: null,
    } as const;
  }
}

export async function createPasswordResetToken(userId: string) {
  const rawToken = randomBytes(32).toString("hex");
  const expiresAt = addDays(new Date(), 1);

  await db.passwordResetToken.create({
    data: {
      userId,
      tokenHash: hashResetToken(rawToken),
      expiresAt,
    },
  });

  return rawToken;
}

export async function consumePasswordResetToken(rawToken: string) {
  const tokenHash = hashResetToken(rawToken);
  const token = await db.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!token || token.usedAt || token.expiresAt < new Date()) {
    return null;
  }

  return token;
}

export async function markPasswordResetTokenUsed(tokenId: string) {
  return db.passwordResetToken.update({
    where: { id: tokenId },
    data: {
      usedAt: new Date(),
    },
  });
}

export async function announcementAudienceFilter(audience: AnnouncementAudience, role: Role) {
  if (audience === AnnouncementAudience.ALL) {
    return true;
  }

  if (audience === AnnouncementAudience.PREFECTS) {
    return role === Role.PREFECT;
  }

  if (audience === AnnouncementAudience.ADMINS) {
    return role === Role.ADMIN || role === Role.SUPER_ADMIN;
  }

  return role === Role.TEACHER || role === Role.ADMIN || role === Role.SUPER_ADMIN;
}

export function buildCronSecretHeader() {
  return { Authorization: `Bearer ${env.CRON_SECRET}` };
}
