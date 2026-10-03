import JSZip from "jszip";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ROOT = process.cwd();

/** Files at the project root that should be included in the download. */
const TOP_LEVEL_FILES = [
  "package.json",
  "next.config.ts",
  "tsconfig.json",
  "drizzle.config.json",
  "eslint.config.mjs",
  "postcss.config.mjs",
  ".env.example",
  ".gitignore",
  "README.md",
];

/** Directories that contain the source code. */
const SRC_DIRS = ["src"];

const SKIP_NAMES = new Set([".DS_Store", "next-env.d.ts", ".env", ".env.local"]);

async function addDirectory(zip: JSZip, absDir: string, zipDir: string) {
  let entries;
  try {
    entries = await fs.readdir(absDir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP_NAMES.has(entry.name)) continue;
    const abs = path.join(absDir, entry.name);
    const rel = path.posix.join(zipDir, entry.name);
    if (entry.isDirectory()) {
      await addDirectory(zip, abs, rel);
    } else if (entry.isFile()) {
      const buf = await fs.readFile(abs);
      zip.file(rel, buf);
    }
  }
}

export async function GET() {
  const zip = new JSZip();

  for (const name of TOP_LEVEL_FILES) {
    try {
      const buf = await fs.readFile(path.join(ROOT, name));
      zip.file(name, buf);
    } catch {
      // A missing optional file should not break the download.
    }
  }

  for (const dir of SRC_DIRS) {
    await addDirectory(zip, path.join(ROOT, dir), dir);
  }

  const content = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return new Response(new Uint8Array(content), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Length": String(content.byteLength),
      "Content-Disposition":
        'attachment; filename="clouddrive-source.zip"',
    },
  });
}