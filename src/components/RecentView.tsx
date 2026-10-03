"use client";

import { useEffect, useState } from "react";
import { FileIcon } from "./FileIcon";

type Summary = {
  id: string;
  name: string;
  extension: string;
  mimeType: string;
  size: number;
  starred: boolean;
  folderId: string | null;
  updatedAt: string;
};

type Props = {
  refreshKey?: number;
  onOpen: (id: string) => void;
};

export function RecentView({ refreshKey = 0, onOpen }: Props) {
  const [items, setItems] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/files?folderId=null")
      .then((r) => r.json())
      .then((d) => {
        const all = d.files ?? [];
        all.sort((a: Summary, b: Summary) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
        setItems(all.slice(0, 12));
      })
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="grid place-items-center py-10 text-slate-400">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 p-10 text-center">
        <div className="text-base font-medium text-slate-700">
          Nothing here yet
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Upload a few files and they&apos;ll show up here so you can quickly
          jump back into what you were working on last.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((f) => (
        <li
          key={f.id}
          className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
          onClick={() => onOpen(f.id)}
        >
          <div className="flex items-center gap-3">
            <FileIcon
              extension={f.extension}
              mimeType={f.mimeType}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-slate-800">
                {f.starred ? "★ " : ""}
                {f.name}
              </div>
              <div className="truncate text-xs text-slate-500">
                Updated {formatRelative(f.updatedAt)} · {formatSize(f.size)}
              </div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <a
              href={`/api/files/${f.id}/raw?download=1`}
              onClick={(e) => e.stopPropagation()}
              className="rounded-md bg-slate-100 px-2 py-1 text-center text-xs font-medium text-slate-700 hover:bg-slate-200"
            >
              Download
            </a>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpen(f.id);
              }}
              className="rounded-md bg-indigo-50 px-2 py-1 text-center text-xs font-medium text-indigo-700 hover:bg-indigo-100"
            >
              Open
            </button>
            <a
              href={`/api/files/${f.id}/raw`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="rounded-md bg-emerald-50 px-2 py-1 text-center text-xs font-medium text-emerald-700 hover:bg-emerald-100"
            >
              Preview
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}

function formatRelative(s: string) {
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

function formatSize(n: number) {
  if (!n) return "0 B";
  const u = ["B", "KB", "MB", "GB"];
  const i = Math.min(u.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  return `${(n / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${u[i]}`;
}