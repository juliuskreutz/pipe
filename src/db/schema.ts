import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const entriesTable = sqliteTable("entries", {
  id: integer().primaryKey({ autoIncrement: true }),
  content: text().notNull(),
});
