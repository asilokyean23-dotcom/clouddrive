"use client";

import { useEffect, useMemo, useState } from "react";
import { FolderIcon } from "./FolderIcon";

type Folder = {
  id: string;
  parentId: string | null;
  name: string;
  color: string;
  updatedAt: string;
};

type Props = {
  currentFolderId: string | null;
  view: "files" | "starred" | "recent" | "activity";
  onNavigate: (
    folderId: string | null,
    view: "files" | "starred" | "recent" | "activity",
  ) => void;
  refreshKey?: number;
};

type Stats = {
  fileCount: number;
  folderCount: number;
  bytesUsed: number;
};

export function Sidebar({
  currentFolderId,
  view,
  onNavigate,
  refreshKey = 0,
}: Props) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [stats, setStats] = useState<Stats>({ fileCount: 0, folderCount: 0, bytesUsed: 0 });

  useEffect(() => {
    fetch("/api/folders?parentId=null")
      .then((r) => r.json())
      .then((data) => setFolders(data.folders ?? []))
      .catch(() => {});
  }, [refreshKey]);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, [refreshKey]);

  const tree = useMemo(() => buildTree(folders), [folders]);
  const usedGb = stats.bytesUsed / 1024 / 1024 / 1024;

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col gap-4 border-r border-slate-200 bg-white/60 p-4 backdrop-blur">
      <div className="rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 p-4 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="floaty grid h-12 w-12 place-items-center rounded-xl bg-white/20 ring-1 ring-white/40">
            <span className="text-2xl">☁️</span>
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">
              My CloudDrive
            </div>
            <div className="text-xs text-white/80">
              Your USB, online. Anywhere.
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-white/90">
            <span>{stats.fileCount} files</span>
            <span>{usedGb.toFixed(2)} GB used</span>
          </div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-white/20">
            <div
              className="h-1.5 rounded-full bg-white/90"
              style={{ width: `${Math.min(100, usedGb * 2.5)}%` }}
            />
          </div>
          <div className="mt-1 text-[11px] text-white/70">
            Tip: drag files into the page to upload.
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5 text-sm">
        <NavItem
          active={view === "files" && currentFolderId === null}
          onClick={() => onNavigate(null, "files")}
          icon="🏠"
          label="My Drive"
        />
        <NavItem
          active={view === "starred"}
          onClick={() => onNavigate(null, "starred")}
          icon="⭐"
          label="Starred"
          badge={null}
        />
        <NavItem
          active={view === "recent"}
          onClick={() => onNavigate(null, "recent")}
          icon="🕒"
          label="Recent"
        />
        <NavItem
          active={view === "activity"}
          onClick={() => onNavigate(null, "activity")}
          icon="📓"
          label="Activity"
        />
      </nav>

      <div className="mt-2">
        <div className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Folders
        </div>
        <div className="mt-1 max-h-72 overflow-y-auto pr-1">
          {tree.length === 0 ? (
            <div className="px-2 py-2 text-xs text-slate-500">
              No folders yet — create one with the “+ Folder” button above.
            </div>
          ) : (
            <FolderTree
              nodes={tree}
              currentFolderId={currentFolderId}
              view={view}
              onOpen={(id) => onNavigate(id, "files")}
            />
          )}
        </div>
      </div>

      <div className="mt-auto rounded-xl bg-white p-4 text-xs text-slate-600 ring-1 ring-slate-200">
        <div className="font-semibold text-slate-800">School ↔ Home</div>
        <p className="mt-1 leading-relaxed">
          Save a draft at the school library, finish it at home on your phone.
          Anything you upload appears on every device using this link.
        </p>
        <a
          href="/api/source"
          className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800"
        >
          ⬇️ Download this app (.zip)
        </a>
        <p className="mt-2 leading-relaxed text-slate-500">
          Grab the full source code, then upload it to GitHub to make this app
          yours forever.
        </p>
      </div>
    </aside>
  );
}

function NavItem({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  badge?: string | null;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left transition ${
        active
          ? "bg-indigo-100 text-indigo-800"
          : "text-slate-700 hover:bg-slate-100"
      }`}
    >
      <span className="grid h-7 w-6 place-items-center text-base">{icon}</span>
      <span className="font-medium">{label}</span>
      {badge && (
        <span className="ml-auto rounded-full bg-indigo-500 px-2 py-0.5 text-[10px] font-semibold text-white">
          {badge}
        </span>
      )}
    </button>
  );
}

type FolderNode = Folder & { children: FolderNode[] };

function buildTree(folders: Folder[]): FolderNode[] {
  const map = new Map<string, FolderNode>();
  folders.forEach((f) => map.set(f.id, { ...f, children: [] }));
  const roots: FolderNode[] = [];
  folders.forEach((f) => {
    const node = map.get(f.id)!;
    if (f.parentId && map.has(f.parentId)) {
      map.get(f.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function FolderTree({
  nodes,
  currentFolderId,
  view,
  onOpen,
}: {
  nodes: FolderNode[];
  currentFolderId: string | null;
  view: string;
  onOpen: (id: string) => void;
}) {
  return (
    <ul className="flex flex-col gap-0.5">
      {nodes.map((node) => (
        <FolderNodeRow
          key={node.id}
          node={node}
          depth={0}
          currentFolderId={currentFolderId}
          view={view}
          onOpen={onOpen}
        />
      ))}
    </ul>
  );
}

function FolderNodeRow({
  node,
  depth,
  currentFolderId,
  view,
  onOpen,
}: {
  node: FolderNode;
  depth: number;
  currentFolderId: string | null;
  view: string;
  onOpen: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = view === "files" && currentFolderId === node.id;
  return (
    <li>
      <div
        className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition ${
          active
            ? "bg-indigo-100 text-indigo-800"
            : "text-slate-700 hover:bg-slate-100"
        }`}
        style={{ paddingLeft: 8 + depth * 12 }}
      >
        <button
          type="button"
          aria-label={open ? "Collapse" : "Expand"}
          className="grid h-4 w-4 place-items-center text-slate-400 hover:text-slate-700"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
        >
          {node.children.length === 0 ? "·" : open ? "▾" : "▸"}
        </button>
        <button
          type="button"
          onClick={() => onOpen(node.id)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <FolderIcon color={node.color} size="sm" />
          <span className="truncate">{node.name}</span>
        </button>
      </div>
      {open && node.children.length > 0 && (
        <ul className="flex flex-col gap-0.5">
          {node.children.map((c) => (
            <FolderNodeRow
              key={c.id}
              node={c}
              depth={depth + 1}
              currentFolderId={currentFolderId}
              view={view}
              onOpen={onOpen}
            />
          ))}
        </ul>
      )}
    </li>
  );
}