import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function logAudit(input: {
  actorId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  summary: string;
  meta?: Record<string, unknown>;
}) {
  return db.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      summary: input.summary,
      meta: input.meta as Prisma.InputJsonValue | undefined,
    },
  });
}
