import { getDb } from "./client";
import type { Appointment, AppointmentWithMember } from "../types/models";

export async function listAppointments(familyMemberId: number): Promise<Appointment[]> {
  const db = await getDb();
  return db.getAllAsync<Appointment>(
    `SELECT * FROM appointments WHERE family_member_id = ? ORDER BY scheduled_for ASC`,
    [familyMemberId]
  );
}

/** Next upcoming appointment across the whole family, for the Home screen. */
export async function getNextAppointment(): Promise<AppointmentWithMember | null> {
  const db = await getDb();
  return db.getFirstAsync<AppointmentWithMember>(
    `SELECT a.*, fm.name as familyMemberName
     FROM appointments a
     JOIN family_members fm ON fm.id = a.family_member_id
     WHERE a.scheduled_for >= datetime('now')
     ORDER BY a.scheduled_for ASC
     LIMIT 1`
  );
}

export async function createAppointment(input: {
  familyMemberId: number;
  title: string;
  doctorName?: string;
  location?: string;
  scheduledFor: string;
  notes?: string;
}): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO appointments (family_member_id, title, doctor_name, location, scheduled_for, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.familyMemberId,
      input.title,
      input.doctorName ?? null,
      input.location ?? null,
      input.scheduledFor,
      input.notes ?? null,
    ]
  );
  return result.lastInsertRowId;
}

export async function deleteAppointment(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM appointments WHERE id = ?`, [id]);
}
