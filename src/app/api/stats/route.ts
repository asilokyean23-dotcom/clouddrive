import { db } from "@/db";
import { files, folders } from "@/db/schema";
import { getDriveId } from "@/lib/drive";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const driveId = await getDriveId();
  const fileRows = await db
    .select({
      total: sql<number>`COUNT(*)::int`,
      bytes: sql<number>`COALESCE(SUM(${files.size}), 0)::bigint`,
    })
    .from(files)
    .where(eq(files.driveId, driveId));
  const folderRows = await db
    .select({ total: sql<number>`COUNT(*)::int` })
    .from(folders)
    .where(eq(folders.driveId, driveId));

  return Response.json({
    fileCount: fileRows[0]?.total ?? 0,
    folderCount: folderRows[0]?.total ?? 0,
    bytesUsed: Number(fileRows[0]?.bytes ?? 0),
  });
}