"use server";

import { revalidatePath } from "next/cache";
import { AccountStatus, AbsenceStatus, Role, TaskStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { initialActionState, type ActionState } from "@/lib/action-state";
import {
  announcementSchema,
  absenceSchema,
  classSchema,
  dutyAssignmentSchema,
  eventSchema,
  locationSchema,
  platformSettingsSchema,
  staffCreationSchema,
  smtpSettingsSchema,
  taskSchema,
} from "@/lib/schemas";
import { hashPassword } from "@/lib/password";
import { assignmentRoles, dutyManagerRoles, verificationRoles } from "@/lib/permissions";
import { requireRole, requireUser } from "@/lib/session";
import {
  encryptSystemSecret,
  getSystemSettingsRecord,
  upsertSystemSettings,
} from "@/lib/system-settings";
import {
  ensureQrPassForUser,
  queueCalendarReminders,
  queueTaskReminders,
} from "@/lib/workflows";

function formValues(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function dateValue(value?: string) {
  return value ? new Date(value) : undefined;
}

export async function createStaffAction(
  _previousState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void _previousState;
  const actor = await requireRole([Role.SUPER_ADMIN]);
  const parsed = staffCreationSchema.safeParse(formValues(formData));

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const existingUser = await db.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  if (existingUser) {
    return {
      success: false,
      message: "An account already exists for this email.",
    };
  }

  const user = await db.user.create({
    data: {
      email: parsed.data.email.toLowerCase(),
      fullName: parsed.data.fullName,
      whatsappNumber: parsed.data.whatsappNumber,
      passwordHash: await hashPassword(parsed.data.password),
      role: parsed.data.role,
      status: AccountStatus.ACTIVE,
      createdById: actor.id,
    },
  });

  await logAudit({
    actorId: actor.id,
    action: "staff.created",
    targetType: "User",
    targetId: user.id,
    summary: `${parsed.data.role} account created for ${user.fullName}.`,
  });

  revalidatePath("/dashboard/staff");
  return { success: true, message: "Staff account created." };
}

export async function updatePlatformSettingsAction(
  _previousState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void _previousState;
  const actor = await requireRole([Role.SUPER_ADMIN]);
  const parsed = platformSettingsSchema.safeParse(formValues(formData));

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await upsertSystemSettings({
      schoolName: parsed.data.schoolName,
      shortName: parsed.data.shortName,
      motto: parsed.data.motto,
      footerLabel: parsed.data.footerLabel,
      supportWhatsappNumber: parsed.data.supportWhatsappNumber,
      appUrl: parsed.data.appUrl,
      attendanceCutoffHour: parsed.data.attendanceCutoffHour,
    });
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unable to save platform settings.",
    };
  }

  await logAudit({
    actorId: actor.id,
    action: "settings.platform_updated",
    targetType: "SystemSetting",
    targetId: "1",
    summary: "Platform settings were updated.",
  });

  revalidatePath("/");
  revalidatePath("/login");
  revalidatePath("/register");
  revalidatePath("/forgot-password");
  revalidatePath("/reset-password");
  revalidatePath("/scan");
  revalidatePath("/setup");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");

  return { success: true, message: "Platform settings saved." };
}

export async function updateSmtpSettingsAction(
  _previousState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void _previousState;
  const actor = await requireRole([Role.SUPER_ADMIN]);
  const parsed = smtpSettingsSchema.safeParse(formValues(formData));

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const existing = await getSystemSettingsRecord();
  const smtpPassEncrypted = parsed.data.useCustomSmtp
    ? parsed.data.smtpPass
      ? encryptSystemSecret(parsed.data.smtpPass)
      : existing?.smtpPassEncrypted ?? null
    : null;

  try {
    await upsertSystemSettings({
      useCustomSmtp: parsed.data.useCustomSmtp,
      smtpHost: parsed.data.useCustomSmtp ? parsed.data.smtpHost ?? "" : null,
      smtpPort: parsed.data.useCustomSmtp ? parsed.data.smtpPort : null,
      smtpUser: parsed.data.useCustomSmtp ? parsed.data.smtpUser ?? "" : null,
      smtpPassEncrypted,
      smtpFrom: parsed.data.useCustomSmtp ? parsed.data.smtpFrom ?? "" : null,
      smtpSecure: parsed.data.useCustomSmtp ? parsed.data.smtpSecure : null,
    });
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unable to save email settings.",
    };
  }

  await logAudit({
    actorId: actor.id,
    action: "settings.smtp_updated",
    targetType: "SystemSetting",
    targetId: "1",
    summary: parsed.data.useCustomSmtp
      ? "Custom SMTP settings were updated."
      : "Custom SMTP was disabled and environment fallback is active.",
  });

  revalidatePath("/dashboard/settings");

  return {
    success: true,
    message: parsed.data.useCustomSmtp
      ? "Custom SMTP settings saved."
      : "Custom SMTP disabled. Environment email settings will be used.",
  };
}

export async function verifyPrefectAction(formData: FormData) {
  const actor = await requireRole(verificationRoles);
  const userId = formData.get("userId")?.toString();

  if (!userId) {
    return;
  }

  const updatedUser = await db.user.update({
    where: { id: userId },
    data: { status: AccountStatus.ACTIVE },
  });

  await ensureQrPassForUser(userId);
  await logAudit({
    actorId: actor.id,
    action: "prefect.verified",
    targetType: "User",
    targetId: updatedUser.id,
    summary: `${updatedUser.fullName} was verified.`,
  });

  revalidatePath("/dashboard/prefects");
}

export async function toggleSuspensionAction(formData: FormData) {
  const actor = await requireRole([Role.SUPER_ADMIN]);
  const userId = formData.get("userId")?.toString();

  if (!userId || userId === actor.id) {
    return;
  }

  const user = await db.user.findUnique({ where: { id: userId } });

  if (!user) {
    return;
  }

  const nextStatus =
    user.status === AccountStatus.SUSPENDED
      ? user.role === Role.PREFECT
        ? AccountStatus.PENDING_VERIFICATION
        : AccountStatus.ACTIVE
      : AccountStatus.SUSPENDED;

  await db.user.update({
    where: { id: userId },
    data: {
      status: nextStatus,
    },
  });

  await logAudit({
    actorId: actor.id,
    action: "user.status_changed",
    targetType: "User",
    targetId: userId,
    summary: `${user.fullName} status changed to ${nextStatus}.`,
  });

  revalidatePath("/dashboard/prefects");
  revalidatePath("/dashboard/staff");
}

export async function createClassAction(
  _previousState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void _previousState;
  const actor = await requireRole(dutyManagerRoles);
  const parsed = classSchema.safeParse(formValues(formData));

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  await db.academicClass.upsert({
    where: {
      grade_section: {
        grade: parsed.data.grade,
        section: parsed.data.section,
      },
    },
    update: {
      label: parsed.data.label,
      isActive: true,
    },
    create: parsed.data,
  });

  await logAudit({
    actorId: actor.id,
    action: "class.saved",
    targetType: "AcademicClass",
    summary: `Class ${parsed.data.label} was saved.`,
  });

  revalidatePath("/dashboard/duties");
  return { success: true, message: "Class saved." };
}

export async function createLocationAction(
  _previousState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void _previousState;
  const actor = await requireRole(dutyManagerRoles);
  const parsed = locationSchema.safeParse(formValues(formData));

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  await db.dutyLocation.upsert({
    where: { name: parsed.data.name },
    update: {
      description: parsed.data.description,
      isActive: true,
    },
    create: parsed.data,
  });

  await logAudit({
    actorId: actor.id,
    action: "location.saved",
    targetType: "DutyLocation",
    summary: `Duty location ${parsed.data.name} was saved.`,
  });

  revalidatePath("/dashboard/duties");
  return { success: true, message: "Location saved." };
}

export async function assignDutyAction(
  _previousState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void _previousState;
  const actor = await requireRole(assignmentRoles);
  const parsed = dutyAssignmentSchema.safeParse(formValues(formData));

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  await db.dutyAssignment.create({
    data: {
      assigneeId: parsed.data.assigneeId,
      assignedById: actor.id,
      kind: parsed.data.kind,
      academicClassId: parsed.data.academicClassId,
      dutyLocationId: parsed.data.dutyLocationId,
      title: parsed.data.title,
      notes: parsed.data.notes,
      startsOn: dateValue(parsed.data.startsOn),
      endsOn: dateValue(parsed.data.endsOn),
    },
  });

  await logAudit({
    actorId: actor.id,
    action: "duty.assigned",
    targetType: "DutyAssignment",
    summary: `Duty "${parsed.data.title}" was assigned.`,
  });

  revalidatePath("/dashboard/duties");
  return { success: true, message: "Duty assigned." };
}

export async function createTaskAction(
  _previousState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void _previousState;
  const actor = await requireRole([Role.ADMIN, Role.SUPER_ADMIN]);
  const parsed = taskSchema.safeParse(formValues(formData));

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const task = await db.task.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      priority: parsed.data.priority,
      dueAt: dateValue(parsed.data.dueAt),
      assigneeId: parsed.data.assigneeId,
      createdById: actor.id,
    },
  });

  await queueTaskReminders(task.id);
  await logAudit({
    actorId: actor.id,
    action: "task.created",
    targetType: "Task",
    targetId: task.id,
    summary: `Task "${task.title}" created.`,
  });

  revalidatePath("/dashboard/tasks");
  return { success: true, message: "Task created." };
}

export async function updateTaskStatusAction(formData: FormData) {
  const actor = await requireUser();
  const taskId = formData.get("taskId")?.toString();
  const nextStatus = formData.get("status")?.toString() as TaskStatus | undefined;

  if (!taskId || !nextStatus) {
    return;
  }

  const task = await db.task.findUnique({ where: { id: taskId } });

  if (!task) {
    return;
  }

  const canUpdate =
    task.assigneeId === actor.id ||
    actor.role === Role.ADMIN ||
    actor.role === Role.SUPER_ADMIN;

  if (!canUpdate) {
    return;
  }

  await db.task.update({
    where: { id: taskId },
    data: { status: nextStatus },
  });

  revalidatePath("/dashboard/tasks");
}

export async function createEventAction(
  _previousState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void _previousState;
  const actor = await requireRole([Role.ADMIN, Role.SUPER_ADMIN]);
  const parsed = eventSchema.safeParse(formValues(formData));

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const event = await db.calendarEvent.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      location: parsed.data.location,
      eventDate: new Date(parsed.data.eventDate),
      audience: parsed.data.audience,
      createdById: actor.id,
    },
  });

  await queueCalendarReminders(event.id);
  await logAudit({
    actorId: actor.id,
    action: "event.created",
    targetType: "CalendarEvent",
    targetId: event.id,
    summary: `Event "${event.title}" created.`,
  });

  revalidatePath("/dashboard/calendar");
  return { success: true, message: "Event created." };
}

export async function createAnnouncementAction(
  _previousState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void _previousState;
  const actor = await requireRole([Role.ADMIN, Role.SUPER_ADMIN]);
  const parsed = announcementSchema.safeParse(formValues(formData));

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  await db.announcement.create({
    data: {
      title: parsed.data.title,
      body: parsed.data.body,
      audience: parsed.data.audience,
      createdById: actor.id,
    },
  });

  await logAudit({
    actorId: actor.id,
    action: "announcement.created",
    targetType: "Announcement",
    summary: `Announcement "${parsed.data.title}" published.`,
  });

  revalidatePath("/dashboard/announcements");
  revalidatePath("/dashboard");
  return { success: true, message: "Announcement published." };
}

export async function submitAbsenceAction(
  _previousState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void _previousState;
  const actor = await requireRole([Role.PREFECT]);
  const parsed = absenceSchema.safeParse(formValues(formData));

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  await db.absenceRequest.create({
    data: {
      userId: actor.id,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      reason: parsed.data.reason,
      status: AbsenceStatus.SUBMITTED,
    },
  });

  await logAudit({
    actorId: actor.id,
    action: "absence.submitted",
    targetType: "AbsenceRequest",
    summary: `${actor.fullName} submitted an absence reason.`,
  });

  revalidatePath("/dashboard/attendance");
  revalidatePath("/dashboard");
  return { success: true, message: "Absence submitted for review." };
}

export async function reviewAbsenceAction(formData: FormData) {
  const actor = await requireRole([Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN]);
  const absenceId = formData.get("absenceId")?.toString();
  const status = formData.get("status")?.toString() as AbsenceStatus | undefined;
  const reviewNote = formData.get("reviewNote")?.toString();

  if (!absenceId || !status) {
    return;
  }

  const absence = await db.absenceRequest.update({
    where: { id: absenceId },
    data: {
      status,
      reviewNote,
      reviewedAt: new Date(),
      reviewedById: actor.id,
    },
    include: {
      user: {
        select: {
          fullName: true,
        },
      },
    },
  });

  await logAudit({
    actorId: actor.id,
    action: "absence.reviewed",
    targetType: "AbsenceRequest",
    targetId: absenceId,
    summary: `${absence.user.fullName} absence was marked ${status.toLowerCase()}.`,
    meta: {
      reviewNote,
    },
  });

  revalidatePath("/dashboard/attendance");
  revalidatePath("/dashboard");
}
