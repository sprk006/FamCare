/**
 * FamCare local database schema.
 *
 * All data lives on-device (expo-sqlite / SQLite). Nothing here talks to a
 * remote server — that's the point of a family care-tracking app paired
 * with a local SLM: it should work fully offline.
 */

export const SCHEMA_VERSION = 2;

export const CREATE_TABLES_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS family_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  relationship TEXT,
  date_of_birth TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS care_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_member_id INTEGER NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  category TEXT NOT NULL,        -- e.g. 'medication', 'appointment', 'symptom', 'vitals', 'note'
  title TEXT NOT NULL,
  details TEXT,
  occurred_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_member_id INTEGER NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_at TEXT NOT NULL,
  is_done INTEGER NOT NULL DEFAULT 0,
  notification_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_care_entries_member ON care_entries(family_member_id);
CREATE INDEX IF NOT EXISTS idx_reminders_member ON reminders(family_member_id);
`;
