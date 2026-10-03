"use client";

import { useEffect, useState } from "react";

type Activity = {
  id: string;
  fileId: string | null;
  folderId: string | null;
  kind: string;
  title: string;
  detail: string | null;
  createdAt: string;
};

const ICON_BY_KIND: Record<string, string> = {
  upload: "⬆️",
  create: "📁",
  rename: "✏️",
  move: "↔️",
  delete: "🗑️",
  star: "⭐",
  unstar: "☆",
  restore: "♻️",
};

export function ActivityFeed() {
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activities")
      .then((r) => r.json())
      .then((d) => setItems(d.activities ?? []))
      .finally(() => setLoading(false));
  }, []);

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
          No activity yet
        </div>
        <p className="mt-1 text-sm text-slate-500">
          As you upload, rename or move files, this is where the trail of changes
          shows up — handy for remembering what you did at school last period.
        </p>
      </div>
    );
  }

  return (
    <ol className="space-y-3">
      {items.map((a) => (
        <li
          key={a.id}
          className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
        >
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-50 text-lg">
            {ICON_BY_KIND[a.kind] ?? "•"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-slate-800">{a.title}</div>
            {a.detail && (
              <div className="text-xs text-slate-500">{a.detail}</div>
            )}
          </div>
          <div className="shrink-0 text-xs text-slate-500">
            {formatTime(a.createdAt)}
          </div>
        </li>
      ))}
    </ol>
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