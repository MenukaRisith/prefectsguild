import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { buildQrPassBundle } from "@/lib/workflows";
import { getCurrentUser } from "@/lib/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  const actor = await getCurrentUser();

  if (!actor) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (
    actor.role !== Role.TEACHER &&
    actor.role !== Role.ADMIN &&
    actor.role !== Role.SUPER_ADMIN
  ) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { userId } = await context.params;
  const prefect = await db.user.findUnique({
    where: { id: userId },
    include: {
      prefectProfile: true,
    },
  });

  if (!prefect || prefect.role !== Role.PREFECT || prefect.status !== "ACTIVE") {
    return Response.json(
      { error: "Only active prefect accounts can have a printable pass." },
      { status: 404 },
    );
  }

  const bundle = await buildQrPassBundle(prefect.id);

  return new Response(Buffer.from(bundle.pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${bundle.qrPass.prefectIdentifier}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
