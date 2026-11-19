import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const workspaces = sqliteTable("workspaces", {
  owner: text("owner").primaryKey(),
  version: integer("version").notNull(),
  document: text("document").notNull(),
});
export const inquiries = sqliteTable("inquiries", {
  id: text("id").primaryKey(),
  owner: text("owner").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  requestedSlot: text("requested_slot"),
  created: text("created").notNull(),
  status: text("status").notNull(),
});
export const pricing = sqliteTable("pricing", {
  key: text("key").primaryKey(),
  revision: integer("revision").notNull(),
  payload: text("payload").notNull(),
});
