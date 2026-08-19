import * as SQLite from "expo-sqlite";
import { CREATE_TABLES_SQL, MIGRATIONS } from "./schema";

const DB_NAME = "famcare.db";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Returns a singleton, already-migrated database handle.
 * Safe to call from anywhere; the underlying open + migration only runs once.
 */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openAndMigrate();
  }
  return dbPromise;
}

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync(CREATE_TABLES_SQL);
  // Additive column migrations for tables that predate a column. ALTER … ADD
  // COLUMN throws when the column already exists, so each is best-effort.
  for (const sql of MIGRATIONS) {
    try {
      await db.execAsync(sql);
    } catch {
      // Column already present — expected on already-migrated installs.
    }
  }
  return db;
}
