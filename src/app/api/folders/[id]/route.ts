import { NextRequest } from "next/server";
import { db } from "@/db";
import { folders, activities } from "@/db/schema";
import { getDriveId } from "@/lib/drive";
import { sanitizeFilename } from "@/lib/file-utils";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const driveId = await getDriveId();
  const body = (await req.json().catch(() => null)) as
    | { name?: string; color?: string; parentId?: string | null }
    | null;
  if (!body) return Response.json({ error: "Invalid body" }, { status: 400 });

  const existing = await db
    .select()
    .from(folders)
    .where(eq(folders.id, id))
    .limit(1);
  const current = existing[0];
  if (!current || current.driveId !== driveId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const update: Partial<typeof folders.$inferInsert> = {
    updatedAt: new Date(),
  };
  let activityKind: string | null = null;
  let activityTitle = "";

  if (typeof body.name === "string" && body.name.trim().length > 0) {
    const newName = sanitizeFilename(body.name);
    if (newName !== current.name) {
      update.name = newName;
      activityKind = "rename";
      activityTitle = `Renamed folder "${current.name}" → "${newName}"`;
    }
  }

  if (typeof body.color === "string" && body.color !== current.color) {
    update.color = body.color;
  }

  if (
    typeof body.parentId !== "undefined" &&
    body.parentId !== (current.parentId ?? null)
  ) {
    update.parentId = body.parentId ?? null;
    activityKind = "move";
    activityTitle = `Moved folder "${current.name}"`;
  }

  if (Object.keys(update).length > 1) {
    const [row] = await db
      .update(folders)
      .set(update)
      .where(eq(folders.id, id))
      .returning();
    if (activityKind && row) {
      await db.insert(activities).values({
        driveId,
        fileId: null,
        folderId: row.id,
        kind: activityKind,
        title: activityTitle,
      });
    }
    return Response.json({ folder: row ?? null });
  }

  return Response.json({ folder: current });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const driveId = await getDriveId();
  const existing = await db
    .select()
    .from(folders)
    .where(eq(folders.id, id))
    .limit(1);
  const folder = existing[0];
  if (!folder || folder.driveId !== driveId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  await db.delete(folders).where(eq(folders.id, id));
  await db.insert(activities).values({
    driveId,
    fileId: null,
    folderId: null,
    kind: "delete",
    title: `Deleted folder "${folder.name}"`,
  });
  return Response.json({ ok: true });
}