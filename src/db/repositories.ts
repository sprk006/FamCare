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

export async function updateFamilyMember(
  id: number,
  input: { name: string; relationship?: string; dateOfBirth?: string; notes?: string }
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE family_members
     SET name = ?, relationship = ?, date_of_birth = ?, notes = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [input.name, input.relationship ?? null, input.dateOfBirth ?? null, input.notes ?? null, id]
  );
}

export async function deleteFamilyMember(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM family_members WHERE id = ?`, [id]);
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

export async function updateCareEntry(
  id: number,
  input: { category: CareCategory; title: string; details?: string; occurredAt?: string }
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE care_entries
     SET category = ?, title = ?, details = ?, occurred_at = COALESCE(?, occurred_at)
     WHERE id = ?`,
    [input.category, input.title, input.details ?? null, input.occurredAt ?? null, id]
  );
}

export async function deleteCareEntry(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM care_entries WHERE id = ?`, [id]);
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

export async function getReminder(id: number): Promise<Reminder | null> {
  const db = await getDb();
  return db.getFirstAsync<Reminder>(`SELECT * FROM reminders WHERE id = ?`, [id]);
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

export async function setReminderNotificationId(
  id: number,
  notificationId: string | null
): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE reminders SET notification_id = ? WHERE id = ?`, [
    notificationId,
    id,
  ]);
}

export async function markReminderDone(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE reminders SET is_done = 1 WHERE id = ?`, [id]);
}

export async function deleteReminder(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM reminders WHERE id = ?`, [id]);
}
