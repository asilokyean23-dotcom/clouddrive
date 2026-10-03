import { NextRequest } from "next/server";
import { db } from "@/db";
import { files, activities, folders } from "@/db/schema";
import { getDriveId } from "@/lib/drive";
import { summarize } from "@/lib/format";
import { bytesToBase64, getExtension, sanitizeFilename } from "@/lib/file-utils";
import { and, desc as dsc, eq, sql as qsql } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB per file upload

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const folderIdParam = url.searchParams.get("folderId");
  const starredOnly = url.searchParams.get("starred") === "true";
  const search = url.searchParams.get("q")?.trim();

  const driveId = await getDriveId();
  const conds = [eq(files.driveId, driveId)];
  if (folderIdParam === "null" || folderIdParam === "") {
    conds.push(qsql`${files.folderId} IS NULL`);
  } else if (folderIdParam) {
    conds.push(eq(files.folderId, folderIdParam));
  }
  if (starredOnly) conds.push(eq(files.starred, true));
  if (search) {
    const pattern = `%${search.toLowerCase()}%`;
    conds.push(qsql`(LOWER(${files.name}) LIKE ${pattern} OR LOWER(${files.extension}) LIKE ${pattern})`);
  }

  const rows = await db
    .select()
    .from(files)
    .where(and(...conds))
    .orderBy(dsc(files.updatedAt));

  return Response.json({
    files: rows.map(summarize),
    total: rows.length,
  });
}

export async function POST(req: NextRequest) {
  const driveId = await getDriveId();
  const contentType = req.headers.get("content-type") ?? "";

  // multipart upload (drag & drop or file input)
  if (contentType.startsWith("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    const folderIdRaw = form.get("folderId");
    if (!(file instanceof File)) {
      return Response.json({ error: "Missing file" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return Response.json(
        { error: `File too large. Max ${MAX_BYTES / 1024 / 1024} MB.` },
        { status: 413 },
      );
    }
    const buf = new Uint8Array(await file.arrayBuffer());
    const data = bytesToBase64(buf);
    const name = sanitizeFilename(file.name || "untitled");
    const extension = getExtension(name) || file.type.split("/").pop()?.split(";")[0] || "";
    const folderId =
      typeof folderIdRaw === "string" && folderIdRaw.length > 0
        ? folderIdRaw
        : null;

    const [row] = await db
      .insert(files)
      .values({
        driveId,
        folderId,
        name,
        extension: extension.toLowerCase(),
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        data,
      })
      .returning();

    if (row) {
      await db.insert(activities).values({
        driveId,
        fileId: row.id,
        folderId: row.folderId ?? null,
        kind: "upload",
        title: `Uploaded "${row.name}"`,
        detail: `${folderId ? "into folder" : "to root"}`,
      });
      // bump folder timestamp so it bubbles to "recent"
      if (folderId) {
        await db
          .update(folders)
          .set({ updatedAt: new Date() })
          .where(eq(folders.id, folderId));
      }
    }

    return Response.json({ file: row ? summarize(row) : null });
  }

  // JSON "create note" or metadata-only creation
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }
  const { name, content, mimeType, folderId, note } = body as {
    name?: string;
    content?: string;
    mimeType?: string;
    folderId?: string | null;
    note?: string | null;
  };
  if (!name || typeof content !== "string") {
    return Response.json(
      { error: "name and content are required" },
      { status: 400 },
    );
  }
  const buf = new TextEncoder().encode(content);
  const base64 = bytesToBase64(buf);
  const cleanName = sanitizeFilename(name);
  const ext = getExtension(cleanName);
  const [row] = await db
    .insert(files)
    .values({
      driveId,
      folderId: folderId ?? null,
      name: cleanName,
      extension: ext,
      mimeType: mimeType ?? "text/plain",
      size: buf.byteLength,
      data: base64,
      note: note ?? null,
    })
    .returning();
  if (row) {
    await db.insert(activities).values({
      driveId,
      fileId: row.id,
      folderId: row.folderId ?? null,
      kind: "upload",
      title: `Created "${row.name}"`,
      detail: "new file",
    });
  }
  return Response.json({ file: row ? summarize(row) : null });
}