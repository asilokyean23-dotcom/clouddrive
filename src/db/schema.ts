import {
  pgTable,
  text,
  timestamp,
  bigint,
  uuid,
  boolean,
  index,
} from "drizzle-orm/pg-core";

/**
 * A "drive" represents a single personal cloud USB. For this app the student
 * gets one personal drive they can access from school and home.
 */
/** A student account. Passwords are stored as bcrypt hashes only. */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Login sessions. The cookie holds a random token, never the password. */
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const drives = pgTable("drives", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** The owner of this drive. One drive per student account. */
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("My SkyLocker"),
  /** Hex color used for the drive's avatar */
  color: text("color").notNull().default("#4f46e5"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Folders inside a drive. Nested via parentId. The root folder is a virtual
 * folder with parentId = null.
 */
export const folders = pgTable(
  "folders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    driveId: uuid("drive_id")
      .notNull()
      .references(() => drives.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id"),
    name: text("name").notNull(),
    color: text("color").notNull().default("#6366f1"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    driveIdx: index("folders_drive_idx").on(table.driveId),
    parentIdx: index("folders_parent_idx").on(table.parentId),
  }),
);

/**
 * Files inside a drive. Stored as base64 inside a `text` column so the app
 * is fully self-contained (no external object storage required). For
 * reasonably-sized student files (documents, slide decks, photos) this works
 * very well and keeps the deploy simple.
 */
export const files = pgTable(
  "files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    driveId: uuid("drive_id")
      .notNull()
      .references(() => drives.id, { onDelete: "cascade" }),
    folderId: uuid("folder_id"),
    name: text("name").notNull(),
    /** File extension in lower case, without the dot, e.g. "pdf" */
    extension: text("extension").notNull().default(""),
    /** Browser mime type, e.g. "application/pdf" */
    mimeType: text("mime_type").notNull().default("application/octet-stream"),
    /** Size in bytes */
    size: bigint("size", { mode: "number" }).notNull().default(0),
    /** Base64 encoded file bytes */
    data: text("data").notNull(),
    starred: boolean("starred").notNull().default(false),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    driveIdx: index("files_drive_idx").on(table.driveId),
    folderIdx: index("files_folder_idx").on(table.folderId),
  }),
);

/**
 * Activity log so the student can see the "continue where I left off" feed
 * (most recent edits / uploads across all of their devices).
 */
export const activities = pgTable(
  "activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    driveId: uuid("drive_id")
      .notNull()
      .references(() => drives.id, { onDelete: "cascade" }),
    fileId: uuid("file_id").references(() => files.id, {
      onDelete: "cascade",
    }),
    folderId: uuid("folder_id").references(() => folders.id, {
      onDelete: "cascade",
    }),
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    detail: text("detail"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    driveIdx: index("activities_drive_idx").on(table.driveId),
    createdIdx: index("activities_created_idx").on(table.createdAt),
  }),
);

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Drive = typeof drives.$inferSelect;
export type Folder = typeof folders.$inferSelect;
export type FileRow = typeof files.$inferSelect;
export type Activity = typeof activities.$inferSelect;