import { db } from "@/db";
import { activities } from "@/db/schema";
import { getDriveId } from "@/lib/drive";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const driveId = await getDriveId();
  const rows = await db
    .select()
    .from(activities)
    .where(eq(activities.driveId, driveId))
    .orderBy(desc(activities.createdAt))
    .limit(50);
  return Response.json({ activities: rows });
}