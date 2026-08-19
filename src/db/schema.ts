/**
 * FamCare local database schema.
 *
 * All data lives on-device (expo-sqlite / SQLite). Nothing here talks to a
 * remote server — that's the point of a family care-tracking app paired
 * with a local SLM: it should work fully offline.
 */

export const SCHEMA_VERSION = 3;

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

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS medications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_member_id INTEGER NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT,
  meal_relation TEXT NOT NULL DEFAULT 'none',   -- 'before_food' | 'after_food' | 'none'
  schedule_times TEXT NOT NULL DEFAULT '[]',    -- JSON array of "HH:MM" strings
  quantity_per_dose REAL NOT NULL DEFAULT 1,
  total_quantity REAL NOT NULL DEFAULT 0,       -- pack size when scanned/added
  low_stock_threshold_days INTEGER NOT NULL DEFAULT 3,
  source_image_uri TEXT,                        -- photo captured during scan, if any
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Doses actually logged (taken/skipped). Today's schedule is derived at read
-- time from medications.schedule_times; a row only exists here once a dose
-- has been marked, so "remaining stock" is consumption-based (count of
-- taken rows), never a mutated counter that could drift on toggles.
CREATE TABLE IF NOT EXISTS dose_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  medication_id INTEGER NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  scheduled_for TEXT NOT NULL,   -- ISO datetime of the scheduled dose slot
  status TEXT NOT NULL,          -- 'taken' | 'skipped'
  logged_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(medication_id, scheduled_for)
);

CREATE INDEX IF NOT EXISTS idx_care_entries_member ON care_entries(family_member_id);
CREATE INDEX IF NOT EXISTS idx_reminders_member ON reminders(family_member_id);
CREATE INDEX IF NOT EXISTS idx_medications_member ON medications(family_member_id);
CREATE INDEX IF NOT EXISTS idx_dose_logs_medication ON dose_logs(medication_id);
`;
