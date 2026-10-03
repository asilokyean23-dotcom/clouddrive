import { getFileCategory } from "@/lib/format";

type Props = {
  extension: string;
  mimeType: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

/**
 * Lightweight SVG-based icon for a file based on its category. We avoid
 * loading any icon font so this stays self-contained.
 */
export function FileIcon({ extension, mimeType, className, size = "md" }: Props) {
  const cat = getFileCategory(extension, mimeType);
  const dim =
    size === "sm" ? "h-8 w-8" : size === "lg" ? "h-14 w-14" : "h-10 w-10";
  const wrapper = `relative inline-flex shrink-0 items-center justify-center rounded-lg ${className ?? ""}`.trim();
  const label = (extension || cat).slice(0, 4).toUpperCase() || "FILE";

  const palette: Record<typeof cat, { bg: string; ring: string; text: string; accent: string }> = {
    document: { bg: "bg-sky-50", ring: "ring-sky-200", text: "text-sky-700", accent: "bg-sky-500" },
    spreadsheet: { bg: "bg-emerald-50", ring: "ring-emerald-200", text: "text-emerald-700", accent: "bg-emerald-500" },
    presentation: { bg: "bg-amber-50", ring: "ring-amber-200", text: "text-amber-700", accent: "bg-amber-500" },
    image: { bg: "bg-fuchsia-50", ring: "ring-fuchsia-200", text: "text-fuchsia-700", accent: "bg-fuchsia-500" },
    pdf: { bg: "bg-rose-50", ring: "ring-rose-200", text: "text-rose-700", accent: "bg-rose-500" },
    video: { bg: "bg-indigo-50", ring: "ring-indigo-200", text: "text-indigo-700", accent: "bg-indigo-500" },
    audio: { bg: "bg-violet-50", ring: "ring-violet-200", text: "text-violet-700", accent: "bg-violet-500" },
    code: { bg: "bg-slate-50", ring: "ring-slate-200", text: "text-slate-700", accent: "bg-slate-500" },
    archive: { bg: "bg-orange-50", ring: "ring-orange-200", text: "text-orange-700", accent: "bg-orange-500" },
    other: { bg: "bg-slate-50", ring: "ring-slate-200", text: "text-slate-700", accent: "bg-slate-400" },
  };
  const p = palette[cat];

  return (
    <span
      className={`${wrapper} ${dim} ${p.bg} ring-1 ${p.ring} ${p.text}`}
      aria-hidden
    >
      <span className={`absolute left-1.5 top-1.5 h-1.5 w-1.5 rounded-full ${p.accent}`} />
      <span className="text-[10px] font-semibold tracking-wider">
        {label}
      </span>
      <span className="absolute inset-x-2 bottom-1 flex justify-center">
        <span className="block h-0.5 w-4 rounded-full bg-current opacity-30" />
      </span>
    </span>
  );
}