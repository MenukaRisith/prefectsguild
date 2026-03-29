import {
  AccountStatus,
  AnnouncementAudience,
  ReminderStatus,
  Role,
  TaskStatus,
} from "@prisma/client";
import { db } from "@/lib/db";

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
