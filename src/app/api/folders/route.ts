import { NextRequest } from "next/server";
import { db } from "@/db";
import { folders as foldersModel, activities } from "@/db/schema";
import { getDriveId } from "@/lib/drive";
import { sanitizeFilename } from "@/lib/file-utils";
import { and, asc, eq, isNull } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const parentIdRaw = url.searchParams.get("parentId");
  const all = url.searchParams.get("all") === "1";
  const driveId = await getDriveId();

  if (all) {
    const rows = await db
      .select()
      .from(foldersModel)
      .where(eq(foldersModel.driveId, driveId))
      .orderBy(asc(foldersModel.name));
    return Response.json({ folders: rows });
  }

  const conds = [eq(foldersModel.driveId, driveId)];
  if (parentIdRaw === "null" || !parentIdRaw) {
    conds.push(isNull(foldersModel.parentId));
  } else {
    conds.push(eq(foldersModel.parentId, parentIdRaw));
  }

  const rows = await db
    .select()
    .from(foldersModel)
    .where(and(...conds))
    .orderBy(asc(foldersModel.name));

  return Response.json({ folders: rows });
}

export async function POST(req: NextRequest) {
  const driveId = await getDriveId();
  const body = (await req.json().catch(() => null)) as
    | { name?: string; parentId?: string | null; color?: string }
    | null;
  if (!body || typeof body.name !== "string" || body.name.trim().length === 0) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }
  const name = sanitizeFilename(body.name);

  if (body.parentId) {
    const parent = await db
      .select()
      .from(foldersModel)
      .where(eq(foldersModel.id, body.parentId))
      .limit(1);
    if (!parent[0] || parent[0].driveId !== driveId) {
      return Response.json({ error: "parent not found" }, { status: 404 });
    }
  }

  const [row] = await db
    .insert(foldersModel)
    .values({
      driveId,
      parentId: body.parentId ?? null,
      name,
      color: body.color ?? "#6366f1",
    })
    .returning();

  if (row) {
    await db.insert(activities).values({
      driveId,
      fileId: null,
      folderId: row.id,
      kind: "create",
      title: `Created folder "${row.name}"`,
    });
  }

  return Response.json({ folder: row ?? null });
}

export async function DELETE(req: NextRequest) {
  const driveId = await getDriveId();
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return Response.json({ error: "id is required" }, { status: 400 });
  }
  const existing = await db
    .select()
    .from(foldersModel)
    .where(eq(foldersModel.id, id))
    .limit(1);
  const folder = existing[0];
  if (!folder || folder.driveId !== driveId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  // Move files up to the parent before deleting the folder to avoid losing work
  await db
    .update(foldersModel)
    .set({ parentId: folder.parentId })
    .where(eq(foldersModel.parentId, id));
  await db.delete(foldersModel).where(eq(foldersModel.id, id));
  await db.insert(activities).values({
    driveId,
    fileId: null,
    folderId: null,
    kind: "delete",
    title: `Deleted folder "${folder.name}"`,
  });
  return Response.json({ ok: true });
}