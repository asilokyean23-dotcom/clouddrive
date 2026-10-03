"use client";

import { useEffect, useRef, useState } from "react";
import { FileIcon } from "./FileIcon";
import { formatBytes, formatExact, formatRelative, isPreviewable } from "@/lib/format";

type Summary = {
  id: string;
  name: string;
  extension: string;
  mimeType: string;
  size: number;
  starred: boolean;
  folderId: string | null;
  note: string | null;
  updatedAt: string;
  createdAt: string;
};

type Folder = {
  id: string;
  parentId: string | null;
  name: string;
  color: string;
};

type Props = {
  fileId: string | null;
  onClose: () => void;
  onChanged?: () => void;
  folders: Folder[];
  currentFolderId: string | null;
};

export function FileDrawer({ fileId, onClose, onChanged, folders, currentFolderId }: Props) {
  const [file, setFile] = useState<Summary | null>(null);
  const [textPreview, setTextPreview] = useState<string | null>(null);
  const [savingNote, setSavingNote] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const textCache = useRef<Record<string, string>>({});
  const blobUrlRef = useRef<string | null>(null);

  // Load summary
  useEffect(() => {
    if (!fileId) {
      setFile(null);
      return;
    }
    setFile(null);
    setTextPreview(null);
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setPreviewBlobUrl(null);
    let cancelled = false;
    fetch(`/api/files/${fileId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setFile(data.file ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [fileId]);

  // Load preview if applicable
  useEffect(() => {
    if (!file) return;
    if (!isPreviewable(file.mimeType, file.extension)) {
      setPreviewBlobUrl(null);
      setTextPreview(null);
      return;
    }
    if (textCache.current[file.id] !== undefined) {
      setTextPreview(textCache.current[file.id]);
      return;
    }
    // For large files, only fetch the head via Range request would be needed.
    // We just fetch the whole blob (previewable files are small/medium).
    fetch(`/api/files/${file.id}/raw`)
      .then(async (r) => {
        const ct = r.headers.get("Content-Type") ?? "";
        if (ct.startsWith("text/") || isTextLike(file.extension)) {
          const txt = await r.text();
          textCache.current[file.id] = txt;
          setTextPreview(txt);
          return;
        }
        const b = await r.blob();
        const url = URL.createObjectURL(b);
        blobUrlRef.current = url;
        setPreviewBlobUrl(url);
      })
      .catch(() => {});
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [file]);

  if (!fileId) return null;

  async function toggleStar() {
    if (!file) return;
    await fetch(`/api/files/${file.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ starred: !file.starred }),
    });
    setFile({ ...file, starred: !file.starred });
    onChanged?.();
  }

  async function rename(value: string) {
    if (!file || value === file.name) return;
    await fetch(`/api/files/${file.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: value }),
    });
    setFile({ ...file, name: value });
    onChanged?.();
  }

  async function moveTo(folderId: string | null) {
    if (!file) return;
    await fetch(`/api/files/${file.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId }),
    });
    setFile({ ...file, folderId });
    onChanged?.();
  }

  async function saveNote(value: string) {
    if (!file) return;
    setSavingNote(true);
    await fetch(`/api/files/${file.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: value }),
    });
    setFile({ ...file, note: value });
    setSavingNote(false);
    onChanged?.();
  }

  async function remove() {
    if (!file) return;
    if (!confirm(`Delete "${file.name}"? This cannot be undone.`)) return;
    await fetch(`/api/files/${file.id}`, { method: "DELETE" });
    onChanged?.();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close preview"
        className="flex-1 bg-slate-900/40 backdrop-blur-sm"
      />
      <aside className="flex h-full w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            {file && (
              <FileIcon extension={file.extension} mimeType={file.mimeType} size="sm" />
            )}
            <div className="min-w-0">
              {file ? (
                <EditableName name={file.name} onCommit={rename} />
              ) : (
                <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
              )}
              {file && (
                <div className="text-xs text-slate-500">
                  {formatBytes(file.size)} ·{" "}
                  updated {formatRelative(file.updatedAt)}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {file && (
              <button
                type="button"
                onClick={toggleStar}
                className="grid h-9 w-9 place-items-center rounded-full text-amber-500 hover:bg-amber-50"
                title={file.starred ? "Unstar" : "Star"}
              >
                {file.starred ? "★" : "☆"}
              </button>
            )}
            {file && (
              <a
                href={`/api/files/${file.id}/raw?download=1`}
                className="rounded-full bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Download
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100"
            >
              ✕
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {!file ? (
            <div className="grid h-full place-items-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />
            </div>
          ) : (
            <>
              <PreviewArea
                file={file}
                blobUrl={previewBlobUrl}
                textPreview={textPreview}
              />

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Detail label="Created" value={formatExact(file.createdAt)} />
                <Detail
                  label="Updated"
                  value={formatExact(file.updatedAt)}
                />
                <Detail
                  label="Type"
                  value={`${file.mimeType}${
                    file.extension ? ` (.${file.extension})` : ""
                  }`}
                />
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-500">
                    Folder
                  </div>
                  <select
                    value={file.folderId ?? ""}
                    onChange={(e) => moveTo(e.target.value || null)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    <option value="">(My Drive · root)</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                        {f.id === currentFolderId ? " (current)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-5">
                <label className="text-xs uppercase tracking-wider text-slate-500">
                  Notes for next time
                </label>
                <textarea
                  value={file.note ?? ""}
                  onChange={(e) => setFile({ ...file, note: e.target.value })}
                  onBlur={(e) => saveNote(e.target.value)}
                  placeholder="e.g. Continue chapter 3 on the bus tomorrow"
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                {savingNote && (
                  <div className="mt-1 text-xs text-slate-400">Saving…</div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={remove}
                  className="rounded-lg px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50"
                >
                  Delete file
                </button>
                <a
                  href={`/api/files/${file.id}/raw?download=1`}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Download
                </a>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

function PreviewArea({
  file,
  blobUrl,
  textPreview,
}: {
  file: Summary;
  blobUrl: string | null;
  textPreview: string | null;
}) {
  if (!isPreviewable(file.mimeType, file.extension)) {
    return (
      <div className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500">
        <div className="mx-auto mb-3 h-16 w-16">
          <FileIcon extension={file.extension} mimeType={file.mimeType} size="lg" />
        </div>
        <div className="text-sm">
          No inline preview for this file type. Use Download to open it locally.
        </div>
      </div>
    );
  }

  if (file.mimeType.startsWith("image/") && blobUrl) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={blobUrl}
          alt={file.name}
          className="mx-auto max-h-[480px] w-full object-contain"
        />
      </div>
    );
  }

  if (file.mimeType === "application/pdf" && blobUrl) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-100">
        <iframe
          title={file.name}
          src={blobUrl}
          className="h-[520px] w-full"
        />
      </div>
    );
  }

  if (file.mimeType.startsWith("video/") && blobUrl) {
    return (
      <video controls src={blobUrl} className="w-full rounded-2xl" />
    );
  }

  if (file.mimeType.startsWith("audio/") && blobUrl) {
    return (
      <audio controls src={blobUrl} className="w-full" />
    );
  }

  if (textPreview !== null) {
    const isCode = ["code", "document", "spreadsheet"].includes(categoryOf(file));
    return (
      <pre
        className={`max-h-[520px] overflow-auto rounded-2xl border border-slate-100 p-4 text-xs leading-relaxed ${
          isCode ? "bg-slate-900 text-slate-100" : "bg-slate-50 text-slate-800"
        }`}
      >
        {truncate(textPreview, 60_000)}
      </pre>
    );
  }

  return (
    <div className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500">
      <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />
    </div>
  );
}

function categoryOf(file: { extension: string; mimeType: string }) {
  const ext = file.extension.toLowerCase();
  if (["js", "ts", "tsx", "jsx", "py", "java", "c", "cpp", "cs", "go", "rs", "rb", "php", "html", "css", "json", "xml", "yml", "yaml", "sh", "sql"].includes(ext)) {
    return "code";
  }
  if (["doc", "docx", "odt", "rtf", "txt", "md"].includes(ext)) return "document";
  if (["xls", "xlsx", "csv", "ods"].includes(ext)) return "spreadsheet";
  return "other";
}

function isTextLike(ext: string) {
  return ["txt", "md", "json", "xml", "csv", "log", "yaml", "yml", "html", "css", "js", "ts", "tsx", "jsx", "py", "java", "c", "cpp", "cs", "go", "rs", "rb", "php", "sh", "sql", "env"].includes(ext.toLowerCase());
}

function truncate(s: string, max: number) {
  if (s.length <= max) return s;
  return s.slice(0, max) + "\n\n… (truncated for preview)";
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm text-slate-800">{value}</div>
    </div>
  );
}

function EditableName({
  name,
  onCommit,
}: {
  name: string;
  onCommit: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);

  useEffect(() => {
    setValue(name);
  }, [name]);

  if (editing) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          setEditing(false);
          if (value.trim().length > 0 && value !== name) onCommit(value);
          else setValue(name);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") {
            setValue(name);
            setEditing(false);
          }
        }}
        className="w-full rounded-md border border-indigo-300 bg-white px-2 py-1 text-base font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="truncate text-base font-semibold text-slate-900 hover:text-indigo-700"
    >
      {name}
    </button>
  );
}