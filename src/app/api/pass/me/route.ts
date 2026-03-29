import { Role } from "@prisma/client";
import { buildQrPassBundle } from "@/lib/workflows";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (user.role !== Role.PREFECT || user.status !== "ACTIVE") {
    return Response.json(
      { error: "Only active prefect accounts can access a QR pass." },
      { status: 403 },
    );
  }

  const bundle = await buildQrPassBundle(user.id);

  return new Response(Buffer.from(bundle.pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${bundle.qrPass.prefectIdentifier}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
