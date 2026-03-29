import {
  AccountStatus,
  AbsenceStatus,
  AttendanceScanStatus,
  AnnouncementAudience,
  DutyAssignmentKind,
  ReminderStatus,
  Role,
  TaskStatus,
} from "@prisma/client";
import {
  addDays,
  eachDayOfInterval,
  endOfDay,
  format,
  startOfDay,
  subDays,
} from "date-fns";
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

export async function getStaffDashboardAnalytics(role: Role) {
  const now = new Date();
  const todayKey = toDayKey(now);
  const weekStart = startOfDay(subDays(now, 6));
  const weekEnd = endOfDay(now);
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const [
    attendanceRecords,
    prefects,
    tasks,
    duties,
    classCount,
    locationCount,
    upcomingEvents,
    recentAnnouncements,
    pendingAbsences,
    unresolvedAttendance,
    duplicateScans,
    invalidScans,
    recentAudits,
    auditEntriesLast7Days,
    staffUsers,
  ] = await Promise.all([
    safeRead(
      "queries.getStaffDashboardAnalytics.attendanceRecords",
      () =>
        db.attendanceRecord.findMany({
          where: {
            date: {
              gte: weekStart,
              lte: weekEnd,
            },
          },
          select: {
            dayKey: true,
          },
        }),
      () => [],
    ),
    safeRead(
      "queries.getStaffDashboardAnalytics.prefects",
      () =>
        db.user.findMany({
          where: {
            role: Role.PREFECT,
          },
          select: {
            status: true,
            prefectProfile: {
              select: {
                grade: true,
              },
            },
          },
        }),
      () => [],
    ),
    safeRead(
      "queries.getStaffDashboardAnalytics.tasks",
      () =>
        db.task.findMany({
          select: {
            status: true,
          },
        }),
      () => [],
    ),
    safeRead(
      "queries.getStaffDashboardAnalytics.duties",
      () =>
        db.dutyAssignment.findMany({
          select: {
            kind: true,
          },
        }),
      () => [],
    ),
    safeRead(
      "queries.getStaffDashboardAnalytics.classCount",
      () =>
        db.academicClass.count({
          where: {
            isActive: true,
          },
        }),
      () => 0,
    ),
    safeRead(
      "queries.getStaffDashboardAnalytics.locationCount",
      () =>
        db.dutyLocation.count({
          where: {
            isActive: true,
          },
        }),
      () => 0,
    ),
    safeRead(
      "queries.getStaffDashboardAnalytics.upcomingEvents",
      () =>
        db.calendarEvent.count({
          where: {
            eventDate: {
              gte: now,
              lte: addDays(now, 14),
            },
          },
        }),
      () => 0,
    ),
    safeRead(
      "queries.getStaffDashboardAnalytics.recentAnnouncements",
      () =>
        db.announcement.count({
          where: {
            publishedAt: {
              gte: subDays(now, 14),
            },
          },
        }),
      () => 0,
    ),
    safeRead(
      "queries.getStaffDashboardAnalytics.pendingAbsences",
      () =>
        db.absenceRequest.count({
          where: {
            status: AbsenceStatus.SUBMITTED,
          },
        }),
      () => 0,
    ),
    safeRead(
      "queries.getStaffDashboardAnalytics.unresolvedAttendance",
      () =>
        db.reminder.count({
          where: {
            title: "Attendance reason required",
            dueAt: {
              gte: todayStart,
              lte: todayEnd,
            },
          },
        }),
      () => 0,
    ),
    safeRead(
      "queries.getStaffDashboardAnalytics.duplicateScans",
      () =>
        db.attendanceScanLog.count({
          where: {
            dayKey: todayKey,
            status: AttendanceScanStatus.DUPLICATE,
          },
        }),
      () => 0,
    ),
    safeRead(
      "queries.getStaffDashboardAnalytics.invalidScans",
      () =>
        db.attendanceScanLog.count({
          where: {
            dayKey: todayKey,
            status: AttendanceScanStatus.INVALID,
          },
        }),
      () => 0,
    ),
    role === Role.TEACHER
      ? []
      : safeRead(
          "queries.getStaffDashboardAnalytics.recentAudits",
          () =>
            db.auditLog.findMany({
              orderBy: {
                createdAt: "desc",
              },
              take: 5,
              include: {
                actor: {
                  select: {
                    fullName: true,
                    role: true,
                  },
                },
              },
            }),
          () => [],
        ),
    role === Role.TEACHER
      ? 0
      : safeRead(
          "queries.getStaffDashboardAnalytics.auditEntriesLast7Days",
          () =>
            db.auditLog.count({
              where: {
                createdAt: {
                  gte: weekStart,
                  lte: weekEnd,
                },
              },
            }),
          () => 0,
        ),
    role === Role.SUPER_ADMIN
      ? safeRead(
          "queries.getStaffDashboardAnalytics.staffUsers",
          () =>
            db.user.findMany({
              where: {
                role: {
                  in: [Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN],
                },
              },
              select: {
                role: true,
                status: true,
              },
            }),
          () => [],
        )
      : [],
  ]);

  const attendanceByDay = attendanceRecords.reduce<Record<string, number>>((acc, record) => {
    acc[record.dayKey] = (acc[record.dayKey] ?? 0) + 1;
    return acc;
  }, {});

  const taskStatusCount = tasks.reduce<Record<TaskStatus, number>>(
    (acc, task) => {
      acc[task.status] += 1;
      return acc;
    },
    {
      TODO: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      OVERDUE: 0,
    },
  );

  const dutyCount = duties.reduce<Record<DutyAssignmentKind, number>>(
    (acc, duty) => {
      acc[duty.kind] += 1;
      return acc;
    },
    {
      ACADEMIC: 0,
      LOCATION: 0,
    },
  );

  const gradeMix = prefects.reduce<Record<number, number>>((acc, prefect) => {
    if (
      prefect.status !== AccountStatus.ACTIVE ||
      typeof prefect.prefectProfile?.grade !== "number"
    ) {
      return acc;
    }

    acc[prefect.prefectProfile.grade] = (acc[prefect.prefectProfile.grade] ?? 0) + 1;
    return acc;
  }, {});

  const activePrefects = prefects.filter(
    (prefect) => prefect.status === AccountStatus.ACTIVE,
  ).length;
  const pendingVerification = prefects.filter(
    (prefect) => prefect.status === AccountStatus.PENDING_VERIFICATION,
  ).length;
  const suspendedPrefects = prefects.filter(
    (prefect) => prefect.status === AccountStatus.SUSPENDED,
  ).length;
  const presentToday = attendanceByDay[todayKey] ?? 0;
  const coverageRate = activePrefects
    ? Math.round((presentToday / activePrefects) * 100)
    : 0;
  const openTasks =
    taskStatusCount.TODO + taskStatusCount.IN_PROGRESS + taskStatusCount.OVERDUE;

  return {
    dayKey: todayKey,
    activePrefects,
    presentToday,
    coverageRate,
    pendingVerification,
    suspendedPrefects,
    attendanceTrend: eachDayOfInterval({
      start: weekStart,
      end: todayStart,
    }).map((day) => {
      const dayKey = toDayKey(day);

      return {
        dayKey,
        label: format(day, "EEE"),
        count: attendanceByDay[dayKey] ?? 0,
      };
    }),
    taskMix: [
      { label: "To do", value: taskStatusCount.TODO },
      { label: "In progress", value: taskStatusCount.IN_PROGRESS },
      { label: "Overdue", value: taskStatusCount.OVERDUE },
      { label: "Completed", value: taskStatusCount.COMPLETED },
    ],
    dutyMix: [
      { label: "Academic posts", value: dutyCount.ACADEMIC },
      { label: "Location posts", value: dutyCount.LOCATION },
    ],
    gradeMix: Object.entries(gradeMix)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([grade, value]) => ({
        label: `Grade ${grade}`,
        value,
      })),
    workload: {
      openTasks,
      overdueTasks: taskStatusCount.OVERDUE,
      pendingAbsences,
      unresolvedAttendance,
      duplicateScans,
      invalidScans,
      classCount,
      locationCount,
      upcomingEvents,
      recentAnnouncements,
    },
    governance:
      role === Role.TEACHER
        ? null
        : {
            auditEntriesLast7Days,
            recentAudits: recentAudits.map((entry) => ({
              id: entry.id,
              action: entry.action,
              summary: entry.summary,
              createdAt: entry.createdAt,
              actorName: entry.actor?.fullName || "System",
              actorRole: entry.actor?.role || null,
            })),
            staffMix:
              role === Role.SUPER_ADMIN
                ? [Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN].map((staffRole) => ({
                    label: staffRole.replaceAll("_", " ").toLowerCase(),
                    value: staffUsers.filter((member) => member.role === staffRole).length,
                  }))
                : [],
            activeStaff:
              role === Role.SUPER_ADMIN
                ? staffUsers.filter((member) => member.status === AccountStatus.ACTIVE).length
                : 0,
            suspendedStaff:
              role === Role.SUPER_ADMIN
                ? staffUsers.filter(
                    (member) => member.status === AccountStatus.SUSPENDED,
                  ).length
                : 0,
          },
  };
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
