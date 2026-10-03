"use client";

import { useEffect, useState } from "react";

type Props = {
  view: "grid" | "list";
  folderId: string | null;
  starredOnly?: boolean;
  search?: string;
  refreshKey?: number;
  onOpen: (fileId: string) => void;
  onChanged?: () => void;
};

type Summary = {
  id: string;
  name: string;
  extension: string;
  mimeType: string;
  size: number;
  starred: boolean;
  folderId: string | null;
  updatedAt: string;
  createdAt: string;
};

export function FileList({
  view,
  folderId,
  starredOnly,
  search,
  refreshKey = 0,
  onOpen,
  onChanged,
}: Props) {
  const [items, setItems] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    const params = new URLSearchParams();
    if (folderId) params.set("folderId", folderId);
    else params.set("folderId", "null");
    if (starredOnly) params.set("starred", "true");
    if (search) params.set("q", search);
    setLoading(true);
    fetch(`/api/files?${params.toString()}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data) => {
        setItems(data.files ?? []);
        setError(null);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(String(e));
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [folderId, starredOnly, search, refreshKey]);

  async function toggleStar(id: string, current: boolean) {
    await fetch(`/api/files/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ starred: !current }),
    });
    onChanged?.();
  }

  async function remove(id: string) {
    if (!confirm("Delete this file? This cannot be undone.")) return;
    await fetch(`/api/files/${id}`, { method: "DELETE" });
    onChanged?.();
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-16 text-slate-500">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-rose-50 p-4 text-rose-700 ring-1 ring-rose-200">
        Failed to load files: {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="grid place-items-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 px-6 py-16 text-center">
        <div className="text-base font-medium text-slate-700">No files here yet</div>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          Drag &amp; drop anything — essays, photos, slide decks, code. Then open
          the same URL from school or home to pick up right where you left off.
        </p>
      </div>
    );
  }

  if (view === "grid") {
    return (
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {items.map((item) => (
          <li
            key={item.id}
            className="group relative rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
          >
            <button
              type="button"
              onClick={() => onOpen(item.id)}
              className="flex w-full flex-col items-stretch gap-2 text-left"
            >
              <div className="grid h-24 place-items-center rounded-xl bg-slate-50">
                <span className="text-3xl">📄</span>
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-slate-800">
                  {item.name}
                </div>
                <div className="truncate text-xs text-slate-500">
                  {formatSize(item.size)} · {formatTime(item.updatedAt)}
                </div>
              </div>
            </button>
            <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStar(item.id, item.starred);
                }}
                className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-amber-500 shadow ring-1 ring-slate-200 hover:bg-white"
                title={item.starred ? "Unstar" : "Star"}
              >
                {item.starred ? "★" : "☆"}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(item.id);
                }}
                className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-rose-500 shadow ring-1 ring-slate-200 hover:bg-white"
                title="Delete"
              >
                🗑
              </button>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="hidden px-4 py-3 sm:table-cell">Size</th>
            <th className="hidden px-4 py-3 md:table-cell">Modified</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => (
            <tr
              key={item.id}
              className="cursor-pointer hover:bg-indigo-50/50"
              onClick={() => onOpen(item.id)}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-md bg-slate-100">
                    📄
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-800">
                      {item.starred ? "★ " : ""}
                      {item.name}
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      {(item.extension || "").toUpperCase()}
                    </div>
                  </div>
                </div>
              </td>
              <td className="hidden whitespace-nowrap px-4 py-3 text-slate-600 sm:table-cell">
                {formatSize(item.size)}
              </td>
              <td className="hidden whitespace-nowrap px-4 py-3 text-slate-600 md:table-cell">
                {formatTime(item.updatedAt)}
              </td>
              <td
                className="px-4 py-3 text-right"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="inline-flex gap-1">
                  <button
                    type="button"
                    onClick={() => toggleStar(item.id, item.starred)}
                    className="rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                    title={item.starred ? "Unstar" : "Star"}
                  >
                    {item.starred ? "★ Starred" : "☆ Star"}
                  </button>
                  <a
                    href={`/api/files/${item.id}/raw?download=1`}
                    className="rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                  >
                    Download
                  </a>
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    className="rounded-md px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatSize(n: number) {
  if (!n) return "0 B";
  const u = ["B", "KB", "MB", "GB"];
  const i = Math.min(u.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  return `${(n / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${u[i]}`;
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