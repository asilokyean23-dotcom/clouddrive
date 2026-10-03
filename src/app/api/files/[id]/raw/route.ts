import { NextRequest } from "next/server";
import { db } from "@/db";
import { files } from "@/db/schema";
import { getDriveId } from "@/lib/drive";
import { base64ToBytes } from "@/lib/file-utils";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const driveId = await getDriveId();
  const url = new URL(req.url);
  const downloadFlag = url.searchParams.get("download") === "1";

  const rows = await db.select().from(files).where(eq(files.id, id)).limit(1);
  const row = rows[0];
  if (!row || row.driveId !== driveId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const bytes = base64ToBytes(row.data);
  const headers: Record<string, string> = {
    "Content-Type": row.mimeType || "application/octet-stream",
    "Content-Length": String(bytes.byteLength),
  };
  if (downloadFlag) {
    const safe = row.name.replace(/[\r\n"]/g, "_");
    headers["Content-Disposition"] =
      `attachment; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(row.name)}`;
  } else {
    headers["Cache-Control"] = "private, max-age=300";
  }

  // Return a Uint8Array-backed Response, wrapped in a Blob for cross-runtime
  // safety.
  return new Response(new Blob([new Uint8Array(bytes)]), { headers });
}