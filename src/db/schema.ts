/**
 * FamCare local database schema.
 *
 * All data lives on-device (expo-sqlite / SQLite). Nothing here talks to a
 * remote server — that's the point of a family care-tracking app paired
 * with a local SLM: it should work fully offline.
 */

export const SCHEMA_VERSION = 4;

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

-- v4: Care Tasks + Family Assignment, Appointments, Documents, and the
-- caregiver list those two features assign/attribute to. This app has no
-- real multi-user backend (everything is local to one device), so
-- "caregivers" is a lightweight local contact list, not an auth identity.
CREATE TABLE IF NOT EXISTS caregivers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  relationship TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- A task can belong to one family member (e.g. "Refill Dad's Metformin") or
-- be family-wide (family_member_id NULL, e.g. "Call insurance").
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_member_id INTEGER REFERENCES family_members(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  due_date TEXT,                            -- YYYY-MM-DD, optional
  status TEXT NOT NULL DEFAULT 'open',      -- 'open' | 'done'
  claimed_by_id INTEGER REFERENCES caregivers(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_member_id INTEGER NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  title TEXT NOT NULL,                      -- e.g. "Diabetes follow-up"
  doctor_name TEXT,
  location TEXT,
  scheduled_for TEXT NOT NULL,              -- ISO datetime
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Photo-based for now (reuses the already-linked expo-image-picker that
-- scan.tsx uses) — arbitrary PDF upload would need expo-document-picker,
-- a new native module and another prebuild+native-rebuild cycle for a
-- feature families mostly use by photographing the paper anyway.
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_member_id INTEGER NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',   -- 'prescription' | 'lab_report' | 'scan' | 'insurance' | 'other'
  file_uri TEXT NOT NULL,                   -- local copy in the app's document directory
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_care_entries_member ON care_entries(family_member_id);
CREATE INDEX IF NOT EXISTS idx_reminders_member ON reminders(family_member_id);
CREATE INDEX IF NOT EXISTS idx_medications_member ON medications(family_member_id);
CREATE INDEX IF NOT EXISTS idx_dose_logs_medication ON dose_logs(medication_id);
CREATE INDEX IF NOT EXISTS idx_tasks_member ON tasks(family_member_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_appointments_member ON appointments(family_member_id);
CREATE INDEX IF NOT EXISTS idx_documents_member ON documents(family_member_id);
`;
