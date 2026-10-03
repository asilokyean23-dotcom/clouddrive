import type { FileRow } from "@/db/schema";

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const value = bytes / Math.pow(1024, i);
  const decimals = i === 0 ? 0 : value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(decimals)} ${units[i]}`;
}

export function formatRelative(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 45) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 45) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} d ago`;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatExact(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getFileCategory(
  extension: string,
  mimeType: string,
): "document" | "spreadsheet" | "presentation" | "image" | "pdf" | "video" | "audio" | "code" | "archive" | "other" {
  const ext = extension.toLowerCase();
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (ext === "pdf" || mimeType === "application/pdf") return "pdf";
  if (["doc", "docx", "odt", "rtf", "txt", "md"].includes(ext)) return "document";
  if (["xls", "xlsx", "csv", "ods", "numbers"].includes(ext)) return "spreadsheet";
  if (["ppt", "pptx", "odp", "key"].includes(ext)) return "presentation";
  if (["js", "ts", "tsx", "jsx", "py", "java", "c", "cpp", "cs", "go", "rs", "rb", "php", "html", "css", "json", "xml", "yml", "yaml", "sh", "sql"].includes(ext)) {
    return "code";
  }
  if (["zip", "rar", "7z", "tar", "gz", "bz2", "xz"].includes(ext)) return "archive";
  return "other";
}

export function isPreviewable(mimeType: string, extension: string): boolean {
  if (mimeType.startsWith("image/")) return true;
  if (mimeType.startsWith("text/")) return true;
  if (mimeType === "application/pdf") return true;
  if (mimeType.startsWith("audio/")) return true;
  if (mimeType.startsWith("video/")) return true;
  if (["json", "xml", "csv", "md", "txt", "js", "ts", "tsx", "jsx", "html", "css"].includes(extension.toLowerCase())) {
    return true;
  }
  return false;
}

export type FileSummary = Omit<FileRow, "data">;

export function summarize(file: FileRow): FileSummary {
  // Strip the (potentially huge) data field from API responses
  const { data: _data, ...rest } = file;
  return rest;
}
