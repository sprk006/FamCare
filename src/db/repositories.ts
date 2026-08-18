import { getDb } from "./client";
import type { CareCategory, CareEntry, FamilyMember, Reminder } from "../types/models";

// ---------------------------------------------------------------------------
// Family members
// ---------------------------------------------------------------------------

export async function listFamilyMembers(): Promise<FamilyMember[]> {
  const db = await getDb();
  return db.getAllAsync<FamilyMember>(
    "SELECT * FROM family_members ORDER BY name ASC"
  );
}

export async function createFamilyMember(input: {
  name: string;
  relationship?: string;
  dateOfBirth?: string;
  notes?: string;
}): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO family_members (name, relationship, date_of_birth, notes)
     VALUES (?, ?, ?, ?)`,
    [input.name, input.relationship ?? null, input.dateOfBirth ?? null, input.notes ?? null]
  );
  return result.lastInsertRowId;
}

// ---------------------------------------------------------------------------
// Care entries
// ---------------------------------------------------------------------------

export async function listCareEntries(familyMemberId: number): Promise<CareEntry[]> {
  const db = await getDb();
  return db.getAllAsync<CareEntry>(
    `SELECT * FROM care_entries WHERE family_member_id = ? ORDER BY occurred_at DESC`,
    [familyMemberId]
  );
}

export async function addCareEntry(input: {
  familyMemberId: number;
  category: CareCategory;
  title: string;
  details?: string;
  occurredAt?: string;
}): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO care_entries (family_member_id, category, title, details, occurred_at)
     VALUES (?, ?, ?, ?, COALESCE(?, datetime('now')))`,
    [
      input.familyMemberId,
      input.category,
      input.title,
      input.details ?? null,
      input.occurredAt ?? null,
    ]
  );
  return result.lastInsertRowId;
}

// ---------------------------------------------------------------------------
// Reminders
// ---------------------------------------------------------------------------

export async function listUpcomingReminders(familyMemberId: number): Promise<Reminder[]> {
  const db = await getDb();
  return db.getAllAsync<Reminder>(
    `SELECT * FROM reminders WHERE family_member_id = ? AND is_done = 0 ORDER BY due_at ASC`,
    [familyMemberId]
  );
}

export async function addReminder(input: {
  familyMemberId: number;
  title: string;
  dueAt: string;
}): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO reminders (family_member_id, title, due_at) VALUES (?, ?, ?)`,
    [input.familyMemberId, input.title, input.dueAt]
  );
  return result.lastInsertRowId;
}
