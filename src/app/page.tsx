"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { FileList } from "@/components/FileList";
import { FolderList } from "@/components/FolderList";
import { FileDrawer } from "@/components/FileDrawer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ActivityFeed } from "@/components/ActivityFeed";
import { RecentView } from "@/components/RecentView";

type View = "files" | "starred" | "recent" | "activity";

type Folder = {
  id: string;
  parentId: string | null;
  name: string;
  color: string;
};

export default function HomePage() {
  const [folderId, setFolderId] = useState<string | null>(null);
  const [view, setView] = useState<View>("files");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [refreshKey, setRefreshKey] = useState(0);
  const [openFile, setOpenFile] = useState<string | null>(null);
  const [allFolders, setAllFolders] = useState<Folder[]>([]);
  const [search, setSearch] = useState("");
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creating, setCreating] = useState(false);
  const [dropping, setDropping] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // Fetch all folders so the file-drawer dropdown can list every possible
  // destination folder.
  useEffect(() => {
    fetch("/api/folders?all=1")
      .then((r) => r.json())
      .then((d) => setAllFolders(d.folders ?? []))
      .catch(() => {});
  }, [refreshKey]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }

  function handleNavigate(id: string | null, v: View) {
    setFolderId(id);
    setView(v);
  }

  async function createFolder() {
    if (!newFolderName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFolderName,
          parentId: view === "files" ? folderId : null,
        }),
      });
      if (res.ok) {
        setNewFolderName("");
        setShowCreateFolder(false);
        refresh();
      }
    } finally {
      setCreating(false);
    }
  }

  async function uploadFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (!files.length) return;
    let ok = 0;
    let fail = 0;
    for (const f of files) {
      const form = new FormData();
      form.append("file", f);
      if (view === "files" && folderId) form.append("folderId", folderId);
      try {
        const res = await fetch("/api/files", { method: "POST", body: form });
        if (res.ok) ok++;
        else fail++;
      } catch {
        fail++;
      }
    }
    if (ok > 0) {
      showToast(`Uploaded ${ok} file${ok === 1 ? "" : "s"}${fail ? `, ${fail} failed` : ""}`);
      refresh();
    } else if (fail > 0) {
      showToast(`Upload failed (${fail} file${fail === 1 ? "" : "s"})`);
    }
  }

  // Drag & drop
  const dragCounter = useRef(0);
  function onDragEnter(e: React.DragEvent) {
    if (!e.dataTransfer?.types.includes("Files")) return;
    dragCounter.current += 1;
    setDropping(true);
  }
  function onDragLeave(e: React.DragEvent) {
    if (!e.dataTransfer?.types.includes("Files")) return;
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setDropping(false);
    }
  }
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current = 0;
    setDropping(false);
    if (e.dataTransfer?.files?.length) {
      uploadFiles(e.dataTransfer.files);
    }
  }

  return (
    <div className="flex min-h-screen flex-col" onDragEnter={onDragEnter}>
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/70 px-4 backdrop-blur-md md:px-6">
        <div className="flex items-center gap-2 py-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-md">
            ☁️
          </div>
          <div className="leading-tight">
            <div className="text-base font-semibold text-slate-900">
              CloudDrive
            </div>
            <div className="text-xs text-slate-500">
              Your USB in the cloud
            </div>
          </div>
        </div>
        <div className="ml-2 hidden flex-1 sm:block">
          <div className="relative max-w-xl">
            <input
              type="search"
              placeholder="Search your files…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              🔍
            </span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCreateFolder(true)}
            className="hidden rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:inline-flex"
          >
            + Folder
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-indigo-700"
          >
            ⬆️ Upload
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) uploadFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </header>

      <div className="flex flex-1">
          <Sidebar
            currentFolderId={folderId}
            view={view}
            onNavigate={handleNavigate}
            refreshKey={refreshKey}
          />

          <main
            className="relative flex-1 overflow-x-hidden p-4 md:p-6"
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
          >
            {view === "files" && (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <Breadcrumb
                    folderId={folderId}
                    refreshKey={refreshKey}
                    onNavigate={(id) => {
                      setFolderId(id);
                      setView("files");
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <div className="inline-flex rounded-full border border-slate-200 bg-white p-0.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setLayout("grid")}
                        className={`rounded-full px-3 py-1 ${
                          layout === "grid"
                            ? "bg-slate-900 text-white"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Grid
                      </button>
                      <button
                        type="button"
                        onClick={() => setLayout("list")}
                        className={`rounded-full px-3 py-1 ${
                          layout === "list"
                            ? "bg-slate-900 text-white"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        List
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <FolderList
                    folderId={folderId}
                    onOpenFolder={(id) => {
                      setFolderId(id);
                      setView("files");
                    }}
                    onChanged={refresh}
                    onCreate={() => setShowCreateFolder(true)}
                    refreshKey={refreshKey}
                  />
                </div>

                <FileList
                  view={layout}
                  folderId={folderId}
                  search={search}
                  onOpen={setOpenFile}
                  onChanged={refresh}
                  refreshKey={refreshKey}
                />
              </>
            )}

            {view === "starred" && (
              <>
                <h2 className="mb-3 text-lg font-semibold text-slate-800">
                  ⭐ Starred
                </h2>
                <FileList
                  view={layout}
                  folderId={folderId}
                  starredOnly
                  search={search}
                  onOpen={setOpenFile}
                  onChanged={refresh}
                  refreshKey={refreshKey}
                />
              </>
            )}

            {view === "recent" && (
              <>
                <h2 className="mb-3 text-lg font-semibold text-slate-800">
                  🕒 Recent — continue where you left off
                </h2>
                <RecentView refreshKey={refreshKey} onOpen={setOpenFile} />
              </>
            )}

            {view === "activity" && (
              <>
                <h2 className="mb-3 text-lg font-semibold text-slate-800">
                  📓 Activity log
                </h2>
                <ActivityFeed />
              </>
            )}

            {dropping && (
              <div className="pointer-events-none absolute inset-4 z-20 grid place-items-center rounded-3xl border-4 border-dashed border-indigo-400 bg-indigo-50/80 backdrop-blur-sm">
                <div className="rounded-2xl bg-white px-6 py-5 text-center shadow-lg dropping">
                  <div className="text-3xl">⬇️</div>
                  <div className="mt-1 text-sm font-semibold text-slate-800">
                    Drop to upload to CloudDrive
                  </div>
                  <div className="text-xs text-slate-500">
                    {folderId
                      ? "Will be saved into the current folder"
                      : "Will be saved at My Drive"}
                  </div>
                </div>
              </div>
            )}

            {toast && (
              <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center">
                <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg">
                  {toast}
                </div>
              </div>
            )}
          </main>
        </div>

      <FileDrawer
        fileId={openFile}
        onClose={() => setOpenFile(null)}
        onChanged={refresh}
        folders={allFolders}
        currentFolderId={folderId}
      />

      {showCreateFolder && (
        <div
          className="fixed inset-0 z-40 grid place-items-center bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setShowCreateFolder(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-base font-semibold text-slate-900">
              New folder
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Folders work like on a USB stick — use them to group work for each
              subject or project.
            </p>
            <input
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") createFolder();
                if (e.key === "Escape") setShowCreateFolder(false);
              }}
              placeholder="e.g. Math homework"
              className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateFolder(false)}
                className="rounded-lg px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={createFolder}
                disabled={creating || !newFolderName.trim()}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-indigo-700 disabled:opacity-50"
              >
                {creating ? "Creating…" : "Create folder"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}