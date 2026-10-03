"use client";

import { useEffect, useState } from "react";
import { FolderIcon } from "./FolderIcon";

type Folder = {
  id: string;
  parentId: string | null;
  name: string;
  color: string;
  updatedAt: string;
  createdAt: string;
};

type Props = {
  folderId: string | null;
  refreshKey?: number;
  onOpenFolder: (id: string | null) => void;
  onChanged?: () => void;
  onCreate: () => void;
};

export function FolderList({
  folderId,
  refreshKey = 0,
  onOpenFolder,
  onChanged,
  onCreate,
}: Props) {
  const [items, setItems] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    const params = new URLSearchParams();
    if (folderId) params.set("parentId", folderId);
    else params.set("parentId", "null");
    setLoading(true);
    fetch(`/api/folders?${params.toString()}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data) => setItems(data.folders ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [folderId, refreshKey]);

  async function remove(id: string, name: string) {
    if (
      !confirm(
        `Delete folder "${name}"? Files inside will be moved to its parent.`,
      )
    )
      return;
    await fetch(`/api/folders?id=${id}`, { method: "DELETE" });
    onChanged?.();
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-8 text-slate-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 px-4 py-6 text-center">
        <p className="text-sm text-slate-500">No subfolders here.</p>
        <button
          type="button"
          onClick={onCreate}
          className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-700"
        >
          + Create folder
        </button>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((f) => (
        <li
          key={f.id}
          className="group relative cursor-pointer rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
          onClick={() => onOpenFolder(f.id)}
        >
          <div className="grid h-24 place-items-center rounded-xl bg-slate-50">
            <FolderIcon color={f.color} size="lg" />
          </div>
          <div className="mt-2 min-w-0">
            <div className="truncate text-sm font-medium text-slate-800">
              {f.name}
            </div>
            <div className="truncate text-xs text-slate-500">
              {formatTime(f.updatedAt)}
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              remove(f.id, f.name);
            }}
            className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-rose-500 opacity-0 shadow ring-1 ring-slate-200 transition group-hover:opacity-100 hover:bg-white"
            title="Delete folder"
          >
            🗑
          </button>
        </li>
      ))}
    </ul>
  );
}

function formatTime(s: string) {
  const d = new Date(s);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} d ago`;
  return d.toLocaleDateString();
}