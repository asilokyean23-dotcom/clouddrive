"use client";

import { useEffect, useState } from "react";
import { FolderIcon } from "./FolderIcon";

type Folder = {
  id: string;
  parentId: string | null;
  name: string;
  color: string;
};

type Props = {
  folderId: string | null;
  refreshKey?: number;
  onNavigate: (id: string | null) => void;
};

export function Breadcrumb({ folderId, refreshKey = 0, onNavigate }: Props) {
  const [chain, setChain] = useState<Folder[]>([]);

  useEffect(() => {
    if (!folderId) {
      setChain([]);
      return;
    }
    let cancelled = false;
    fetch("/api/folders?all=1")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const map = new Map<string, Folder>(
          (data.folders as Folder[]).map((f) => [f.id, f]),
        );
        const path: Folder[] = [];
        let cur: string | null = folderId;
        while (cur && map.has(cur)) {
          const f = map.get(cur) as Folder;
          path.unshift(f);
          cur = f.parentId;
        }
        setChain(path);
      })
      .catch(() => setChain([]));
    return () => {
      cancelled = true;
    };
  }, [folderId, refreshKey]);

  return (
    <nav className="flex flex-wrap items-center gap-1 text-sm">
      <button
        type="button"
        onClick={() => onNavigate(null)}
        className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      >
        My Drive
      </button>
      {chain.map((f, i) => (
        <span key={f.id} className="flex items-center gap-1">
          <span className="text-slate-400">/</span>
          {i === chain.length - 1 ? (
            <span className="inline-flex items-center gap-2 rounded-md bg-indigo-100 px-2 py-1 font-medium text-indigo-800">
              <FolderIcon color={f.color} size="sm" />
              {f.name}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate(f.id)}
              className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              <FolderIcon color={f.color} size="sm" />
              {f.name}
            </button>
          )}
        </span>
      ))}
    </nav>
  );
}