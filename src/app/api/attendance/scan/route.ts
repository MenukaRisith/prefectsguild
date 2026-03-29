import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { scanAttendanceByToken } from "@/lib/workflows";

const bodySchema = z.object({
  token: z.string().min(1),
  scannerLabel: z.string().optional(),
});

export async function POST(request: Request) {
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rateLimit = checkRateLimit(`scan:${ipAddress}`, 45, 60 * 1000);

  if (!rateLimit.allowed) {
    return Response.json(
      {
        error: `Too many scans. Retry in ${rateLimit.retryAfter} seconds.`,
      },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const result = await scanAttendanceByToken(
      parsed.data.token,
      parsed.data.scannerLabel,
    );

    return Response.json(result);
  } catch {
    return Response.json({ error: "Unable to process this scan." }, { status: 500 });
  }
}
