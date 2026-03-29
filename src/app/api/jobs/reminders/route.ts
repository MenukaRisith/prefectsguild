import { env } from "@/lib/env";
import { runReminderDispatch } from "@/lib/workflows";

function isAuthorized(request: Request) {
  return request.headers.get("authorization") === `Bearer ${env.CRON_SECRET}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const sentCount = await runReminderDispatch();
  return Response.json({ sentCount });
}
