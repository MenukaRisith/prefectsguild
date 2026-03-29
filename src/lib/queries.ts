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
  return db.reminder.count({
    where: {
      recipientId: userId,
      status: {
        in: [ReminderStatus.PENDING, ReminderStatus.SENT],
      },
    },
  });
}

export async function getVisibleAnnouncements(role: Role) {
  return db.announcement.findMany({
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
  });
}

export async function getOverviewStats(userId: string, role: Role) {
  if (role === Role.PREFECT) {
    const [pendingTasks, dueReminders, attendanceCount] = await Promise.all([
      db.task.count({
        where: {
          assigneeId: userId,
          status: {
            in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.OVERDUE],
          },
        },
      }),
      db.reminder.count({
        where: {
          recipientId: userId,
          status: ReminderStatus.PENDING,
        },
      }),
      db.attendanceRecord.count({
        where: {
          userId,
        },
      }),
    ]);

    return [
      { label: "Open tasks", value: pendingTasks },
      { label: "Live reminders", value: dueReminders },
      { label: "Attendance logs", value: attendanceCount },
    ];
  }

  const [pendingPrefects, activePrefects, openTasks] = await Promise.all([
    db.user.count({
      where: {
        role: Role.PREFECT,
        status: AccountStatus.PENDING_VERIFICATION,
      },
    }),
    db.user.count({
      where: {
        role: Role.PREFECT,
        status: AccountStatus.ACTIVE,
      },
    }),
    db.task.count({
      where: {
        status: {
          in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.OVERDUE],
        },
      },
    }),
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
    db.user.count({
      where: {
        role: Role.PREFECT,
        status: AccountStatus.ACTIVE,
      },
    }),
    db.attendanceRecord.count({
      where: {
        dayKey,
      },
    }),
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
    db.reminder.count({
      where: {
        title: "Attendance reason required",
        dueAt: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    }),
    db.user.count({
      where: {
        role: Role.PREFECT,
        status: AccountStatus.PENDING_VERIFICATION,
      },
    }),
    db.attendanceScanLog.count({
      where: {
        dayKey,
        status: AttendanceScanStatus.DUPLICATE,
      },
    }),
    db.attendanceScanLog.count({
      where: {
        dayKey,
        status: AttendanceScanStatus.INVALID,
      },
    }),
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
  ]);

  return { recentScans, pendingPrefects, upcomingEvents };
}

export async function getPrefectDashboardFeed(userId: string) {
  const now = new Date();
  const [tasks, duties, events, attendanceToday] = await Promise.all([
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
    db.attendanceRecord.findFirst({
      where: {
        userId,
        dayKey: toDayKey(now),
      },
    }),
  ]);

  return {
    tasks,
    duties,
    events,
    attendanceToday,
  };
}
