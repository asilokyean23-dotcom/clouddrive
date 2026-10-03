import { NextRequest } from "next/server";
import { db } from "@/db";
import { files, activities, folders } from "@/db/schema";
import { getDriveId } from "@/lib/drive";
import { summarize } from "@/lib/format";
import { sanitizeFilename } from "@/lib/file-utils";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const driveId = await getDriveId();
  const rows = await db
    .select()
    .from(files)
    .where(eq(files.id, id))
    .limit(1);
  const row = rows[0];
  if (!row || row.driveId !== driveId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json({ file: summarize(row) });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const driveId = await getDriveId();
  const body = (await req.json().catch(() => null)) as
    | {
        name?: string;
        starred?: boolean;
        note?: string | null;
        folderId?: string | null;
      }
    | null;
  if (!body) return Response.json({ error: "Invalid body" }, { status: 400 });

  const existing = await db
    .select()
    .from(files)
    .where(eq(files.id, id))
    .limit(1);
  const current = existing[0];
  if (!current || current.driveId !== driveId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const update: Partial<typeof files.$inferInsert> = {
    updatedAt: new Date(),
  };
  let activityKind: string | null = null;
  let activityTitle = "";
  let activityDetail = "";

  if (typeof body.name === "string" && body.name.trim().length > 0) {
    const newName = sanitizeFilename(body.name);
    if (newName !== current.name) {
      update.name = newName;
      activityKind = "rename";
      activityTitle = `Renamed "${current.name}" → "${newName}"`;
    }
  }

  if (typeof body.starred === "boolean" && body.starred !== current.starred) {
    update.starred = body.starred;
    activityKind = body.starred ? "star" : "unstar";
    activityTitle = body.starred
      ? `Starred "${current.name}"`
      : `Unstarred "${current.name}"`;
  }

  if (typeof body.note !== "undefined" && body.note !== current.note) {
    update.note = body.note;
  }

  if (
    typeof body.folderId !== "undefined" &&
    body.folderId !== (current.folderId ?? null)
  ) {
    update.folderId = body.folderId ?? null;
    activityKind = "move";
    activityTitle = `Moved "${current.name}"`;
    activityDetail = body.folderId ? "into folder" : "to root";
  }

  if (Object.keys(update).length > 1) {
    const [row] = await db
      .update(files)
      .set(update)
      .where(eq(files.id, id))
      .returning();
    if (activityKind && row) {
      await db.insert(activities).values({
        driveId,
        fileId: row.id,
        folderId: row.folderId ?? null,
        kind: activityKind,
        title: activityTitle,
        detail: activityDetail || null,
      });
      // bump destination folder's mtime
      if (row.folderId) {
        await db
          .update(folders)
          .set({ updatedAt: new Date() })
          .where(eq(folders.id, row.folderId));
      }
    }
    return Response.json({ file: row ? summarize(row) : null });
  }

  return Response.json({ file: summarize(current) });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const driveId = await getDriveId();
  const rows = await db
    .select()
    .from(files)
    .where(eq(files.id, id))
    .limit(1);
  const current = rows[0];
  if (!current || current.driveId !== driveId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  await db.delete(files).where(eq(files.id, id));
  await db.insert(activities).values({
    driveId,
    fileId: null,
    folderId: current.folderId ?? null,
    kind: "delete",
    title: `Deleted "${current.name}"`,
    detail: `${Math.round(current.size / 1024)} KB`,
  });
  return Response.json({ ok: true });
}