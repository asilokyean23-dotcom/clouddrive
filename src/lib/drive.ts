import { db } from "@/db";
import { drives, type Drive } from "@/db/schema";
import { ensureSchema } from "@/lib/bootstrap";
import { getCurrentUser } from "@/lib/auth";
import { eq } from "drizzle-orm";

/**
 * Every student account owns exactly one personal drive. All files, folders
 * and activity live inside that drive, which is how each account stays
 * private from the others.
 */
export async function getOrCreateDriveForUser(userId: string): Promise<Drive> {
  await ensureSchema();

  const existing = await db
    .select()
    .from(drives)
    .where(eq(drives.userId, userId))
    .limit(1);
  if (existing[0]) return existing[0];

  const [created] = await db
    .insert(drives)
    .values({ userId, name: "My SkyLocker", color: "#4f46e5" })
    .returning();
  if (!created) throw new Error("Failed to create drive");
  return created;
}

/**
 * Resolves the drive of the signed-in user. Every API route calls this, so
 * data is automatically scoped to the account that owns it.
 */
export async function getDriveId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");
  const drive = await getOrCreateDriveForUser(user.id);
  return drive.id;
}
