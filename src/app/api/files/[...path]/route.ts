import path from "node:path";
import { readStoredFile } from "@/lib/storage";

const mimeTypes = new Map<string, string>([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".pdf", "application/pdf"],
]);

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await context.params;
  const relativePath = segments.join("/");

  try {
    const bytes = await readStoredFile(relativePath);
    const extension = path.extname(relativePath).toLowerCase();

    return new Response(bytes, {
      headers: {
        "Content-Type": mimeTypes.get(extension) ?? "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return Response.json({ error: "File not found." }, { status: 404 });
  }
}
