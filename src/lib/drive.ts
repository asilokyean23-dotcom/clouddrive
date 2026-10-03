import { db } from "@/db";
import { drives, type Drive } from "@/db/schema";
import { eq } from "drizzle-orm";

let cachedDriveId: string | null = null;

/**
 * This is a single-tenant "personal cloud USB" so we keep a single drive per
 * database. On first request we create it and cache its id for the lifetime
 * of the process.
 */
export async function getOrCreateDrive(): Promise<Drive> {
  if (cachedDriveId) {
    const existing = await db
      .select()
      .from(drives)
      .where(eq(drives.id, cachedDriveId))
      .limit(1);
    if (existing.length) return existing[0];
  }

  const all = await db.select().from(drives).limit(1);
  if (all.length) {
    cachedDriveId = all[0].id;
    return all[0];
  }

  const [created] = await db
    .insert(drives)
    .values({ name: "My CloudDrive", color: "#4f46e5" })
    .returning();
  if (!created) throw new Error("Failed to create default drive");
  cachedDriveId = created.id;
  return created;
}

export async function getDriveId(): Promise<string> {
  const drive = await getOrCreateDrive();
  return drive.id;
}