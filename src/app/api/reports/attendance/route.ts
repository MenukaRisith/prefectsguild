import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { formatDisplayDate, formatDisplayDateTime } from "@/lib/date";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (
    user.role !== Role.TEACHER &&
    user.role !== Role.ADMIN &&
    user.role !== Role.SUPER_ADMIN
  ) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const records = await db.attendanceRecord.findMany({
    include: {
      user: {
        select: {
          fullName: true,
          prefectProfile: {
            select: {
              grade: true,
              section: true,
            },
          },
        },
      },
      qrPass: {
        select: {
          prefectIdentifier: true,
        },
      },
    },
    orderBy: {
      scannedAt: "desc",
    },
  });

  const header = [
    "Full Name",
    "Grade",
    "Section",
    "Prefect ID",
    "Attendance Date",
    "Checked In At",
    "Checked Out At",
    "Source",
  ];

  const rows = records.map((record) => [
    record.user.fullName,
    record.user.prefectProfile?.grade?.toString() ?? "",
    record.user.prefectProfile?.section ?? "",
    record.qrPass?.prefectIdentifier ?? "",
    formatDisplayDate(record.date),
    formatDisplayDateTime(record.scannedAt),
    record.checkedOutAt ? formatDisplayDateTime(record.checkedOutAt) : "",
    record.source,
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(","))
    .join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="attendance-report.csv"',
    },
  });
}
