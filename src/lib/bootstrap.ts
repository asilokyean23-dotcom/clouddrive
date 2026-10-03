import { db } from "@/db";
import { sql } from "drizzle-orm";

/**
 * Tables are created automatically the first time the app runs, so a fresh
 * deployment works without any manual database setup.
 *
 * The SQL below mirrors src/db/schema.ts exactly.
 */
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS drives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'My SkyLocker',
  color text NOT NULL DEFAULT '#4f46e5',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_id uuid NOT NULL REFERENCES drives(id) ON DELETE CASCADE,
  parent_id uuid,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6366f1',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_id uuid NOT NULL REFERENCES drives(id) ON DELETE CASCADE,
  folder_id uuid,
  name text NOT NULL,
  extension text NOT NULL DEFAULT '',
  mime_type text NOT NULL DEFAULT 'application/octet-stream',
  size bigint NOT NULL DEFAULT 0,
  data text NOT NULL,
  starred boolean NOT NULL DEFAULT false,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_id uuid NOT NULL REFERENCES drives(id) ON DELETE CASCADE,
  file_id uuid REFERENCES files(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES folders(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE drives ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS drives_user_idx ON drives (user_id);
CREATE INDEX IF NOT EXISTS folders_drive_idx ON folders (drive_id);
CREATE INDEX IF NOT EXISTS folders_parent_idx ON folders (parent_id);
CREATE INDEX IF NOT EXISTS files_drive_idx ON files (drive_id);
CREATE INDEX IF NOT EXISTS files_folder_idx ON files (folder_id);
CREATE INDEX IF NOT EXISTS activities_drive_idx ON activities (drive_id);
CREATE INDEX IF NOT EXISTS activities_created_idx ON activities (created_at);
`;

let bootstrapPromise: Promise<void> | null = null;

/** Create all tables if they don't exist yet. Safe to call many times. */
export function ensureSchema(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = db
      .execute(sql.raw(SCHEMA_SQL))
      .then(() => undefined)
      .catch((err) => {
        // Allow a retry on the next request if the database wasn't ready yet.
        bootstrapPromise = null;
        throw err;
      });
  }
  return bootstrapPromise;
}