import {
  AccountStatus,
  AbsenceStatus,
  AttendanceScanStatus,
  AnnouncementAudience,
  ReminderStatus,
  Role,
  TaskStatus,
} from "@prisma/client";
import { addDays } from "date-fns";
import { db } from "@/lib/db";
import { toDayKey } from "@/lib/date";
import { safeRead } from "@/lib/runtime-safety";

export function getAnnouncementAudiencesForRole(role: Role) {
  switch (role) {
    case Role.PREFECT:
      return [AnnouncementAudience.ALL, AnnouncementAudience.PREFECTS];
    case Role.TEACHER:
      return [AnnouncementAudience.ALL, AnnouncementAudience.STAFF];
    case Role.ADMIN:
    case Role.SUPER_ADMIN:
      return [
        AnnouncementAudience.ALL,
        AnnouncementAudience.STAFF,
        AnnouncementAudience.ADMINS,
      ];
    default:
      return [AnnouncementAudience.ALL];
  }
}

export async function getReminderCount(userId: string) {
  return safeRead(
    "queries.getReminderCount",
    () =>
      db.reminder.count({
        where: {
          recipientId: userId,
          status: {
            in: [ReminderStatus.PENDING, ReminderStatus.SENT],
          },
        },
      }),
    () => 0,
  );
}

export async function getVisibleAnnouncements(role: Role) {
  return safeRead(
    "queries.getVisibleAnnouncements",
    () =>
      db.announcement.findMany({
        where: {
          audience: {
            in: getAnnouncementAudiencesForRole(role),
          },
        },
        orderBy: {
          publishedAt: "desc",
        },
        take: 6,
        include: {
          createdBy: {
            select: {
              fullName: true,
            },
          },
        },
      }),
    () => [],
  );
}

export async function getRecentReminders(userId: string) {
  return safeRead(
    "queries.getRecentReminders",
    () =>
      db.reminder.findMany({
        where: {
          recipientId: userId,
        },
        orderBy: {
          dueAt: "desc",
        },
        take: 5,
      }),
    () => [],
  );
}

export async function getOverviewStats(userId: string, role: Role) {
  if (role === Role.PREFECT) {
    const [pendingTasks, dueReminders, attendanceCount] = await Promise.all([
      safeRead(
        "queries.getOverviewStats.prefect.pendingTasks",
        () =>
          db.task.count({
            where: {
              assigneeId: userId,
              status: {
                in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.OVERDUE],
              },
            },
          }),
        () => 0,
      ),
      safeRead(
        "queries.getOverviewStats.prefect.dueReminders",
        () =>
          db.reminder.count({
            where: {
              recipientId: userId,
              status: ReminderStatus.PENDING,
            },
          }),
        () => 0,
      ),
      safeRead(
        "queries.getOverviewStats.prefect.attendanceCount",
        () =>
          db.attendanceRecord.count({
            where: {
              userId,
            },
          }),
        () => 0,
      ),
    ]);

    return [
      { label: "Open tasks", value: pendingTasks },
      { label: "Live reminders", value: dueReminders },
      { label: "Attendance logs", value: attendanceCount },
    ];
  }

  const [pendingPrefects, activePrefects, openTasks] = await Promise.all([
    safeRead(
      "queries.getOverviewStats.staff.pendingPrefects",
      () =>
        db.user.count({
          where: {
            role: Role.PREFECT,
            status: AccountStatus.PENDING_VERIFICATION,
          },
        }),
      () => 0,
    ),
    safeRead(
      "queries.getOverviewStats.staff.activePrefects",
      () =>
        db.user.count({
          where: {
            role: Role.PREFECT,
            status: AccountStatus.ACTIVE,
          },
        }),
      () => 0,
    ),
    safeRead(
      "queries.getOverviewStats.staff.openTasks",
      () =>
        db.task.count({
          where: {
            status: {
              in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.OVERDUE],
            },
          },
        }),
      () => 0,
    ),
  ]);

  return [
    { label: "Pending prefects", value: pendingPrefects },
    { label: "Active prefects", value: activePrefects },
    { label: "Open tasks", value: openTasks },
  ];
}

export async function getStaffOperationsSnapshot() {
  const now = new Date();
  const dayKey = toDayKey(now);
  const dayStart = new Date(`${dayKey}T00:00:00.000Z`);
  const dayEnd = new Date(`${dayKey}T23:59:59.999Z`);

  const [
    activePrefects,
    presentToday,
    coveredAbsences,
    unresolvedAttendance,
    pendingVerification,
    duplicateScans,
    invalidScans,
  ] = await Promise.all([
    safeRead(
      "queries.getStaffOperationsSnapshot.activePrefects",
      () =>
        db.user.count({
          where: {
            role: Role.PREFECT,
            status: AccountStatus.ACTIVE,
          },
        }),
      () => 0,
    ),
    safeRead(
      "queries.getStaffOperationsSnapshot.presentToday",
      () =>
        db.attendanceRecord.count({
          where: {
            dayKey,
          },
        }),
      () => 0,
    ),
    safeRead(
      "queries.getStaffOperationsSnapshot.coveredAbsences",
      () =>
        db.absenceRequest.count({
          where: {
            status: {
              in: [AbsenceStatus.APPROVED, AbsenceStatus.SUBMITTED],
            },
            startDate: {
              lte: dayEnd,
            },
            endDate: {
              gte: dayStart,
            },
          },
        }),
      () => 0,
    ),
    safeRead(
      "queries.getStaffOperationsSnapshot.unresolvedAttendance",
      () =>
        db.reminder.count({
          where: {
            title: "Attendance reason required",
            dueAt: {
              gte: dayStart,
              lte: dayEnd,
            },
          },
        }),
      () => 0,
    ),
    safeRead(
      "queries.getStaffOperationsSnapshot.pendingVerification",
      () =>
        db.user.count({
          where: {
            role: Role.PREFECT,
            status: AccountStatus.PENDING_VERIFICATION,
          },
        }),
      () => 0,
    ),
    safeRead(
      "queries.getStaffOperationsSnapshot.duplicateScans",
      () =>
        db.attendanceScanLog.count({
          where: {
            dayKey,
            status: AttendanceScanStatus.DUPLICATE,
          },
        }),
      () => 0,
    ),
    safeRead(
      "queries.getStaffOperationsSnapshot.invalidScans",
      () =>
        db.attendanceScanLog.count({
          where: {
            dayKey,
            status: AttendanceScanStatus.INVALID,
          },
        }),
      () => 0,
    ),
  ]);

  return {
    dayKey,
    activePrefects,
    presentToday,
    coveredAbsences,
    unresolvedAttendance,
    pendingVerification,
    duplicateScans,
    invalidScans,
  };
}

export async function getStaffDashboardFeed() {
  const now = new Date();
  const dayKey = toDayKey(now);

  const [recentScans, pendingPrefects, upcomingEvents] = await Promise.all([
    safeRead(
      "queries.getStaffDashboardFeed.recentScans",
      () =>
        db.attendanceScanLog.findMany({
          where: {
            dayKey,
          },
          include: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
          orderBy: {
            scannedAt: "desc",
          },
          take: 8,
        }),
      () => [],
    ),
    safeRead(
      "queries.getStaffDashboardFeed.pendingPrefects",
      () =>
        db.user.findMany({
          where: {
            role: Role.PREFECT,
            status: AccountStatus.PENDING_VERIFICATION,
          },
          include: {
            prefectProfile: {
              select: {
                grade: true,
                displayName: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
          take: 5,
        }),
      () => [],
    ),
    safeRead(
      "queries.getStaffDashboardFeed.upcomingEvents",
      () =>
        db.calendarEvent.findMany({
          where: {
            eventDate: {
              gte: now,
              lte: addDays(now, 14),
            },
          },
          orderBy: {
            eventDate: "asc",
          },
          take: 4,
        }),
      () => [],
    ),
  ]);

  return { recentScans, pendingPrefects, upcomingEvents };
}

export async function getPrefectDashboardFeed(userId: string) {
  const now = new Date();
  const [tasks, duties, events, attendanceToday] = await Promise.all([
    safeRead(
      "queries.getPrefectDashboardFeed.tasks",
      () =>
        db.task.findMany({
          where: {
            assigneeId: userId,
            status: {
              in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.OVERDUE],
            },
          },
          orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
          take: 4,
        }),
      () => [],
    ),
    safeRead(
      "queries.getPrefectDashboardFeed.duties",
      () =>
        db.dutyAssignment.findMany({
          where: {
            assigneeId: userId,
          },
          include: {
            academicClass: true,
            dutyLocation: true,
          },
          orderBy: [{ startsOn: "asc" }, { createdAt: "desc" }],
          take: 4,
        }),
      () => [],
    ),
    safeRead(
      "queries.getPrefectDashboardFeed.events",
      () =>
        db.calendarEvent.findMany({
          where: {
            eventDate: {
              gte: now,
              lte: addDays(now, 14),
            },
          },
          orderBy: {
            eventDate: "asc",
          },
          take: 4,
        }),
      () => [],
    ),
    safeRead(
      "queries.getPrefectDashboardFeed.attendanceToday",
      () =>
        db.attendanceRecord.findFirst({
          where: {
            userId,
            dayKey: toDayKey(now),
          },
        }),
      () => null,
    ),
  ]);

  return {
    tasks,
    duties,
    events,
    attendanceToday,
  };
}
