import { getDb } from "./client";
import type { ActivityItem } from "../types/models";

/**
 * The Family Activity feed — a private log of what actually happened,
 * replacing scattered WhatsApp updates ("Dad's medicine refilled ✓").
 * Built from real logged events only (dose logs, completed tasks,
 * appointments, documents); it doesn't synthesize "missed dose" entries —
 * that's already surfaced live via the Family tab's on_track/needs_attention
 * status, which is time-based rather than event-based.
 */
export async function getRecentActivity(limit = 50): Promise<ActivityItem[]> {
  const db = await getDb();
  return db.getAllAsync<ActivityItem>(
    `
    SELECT 'dose-' || dl.id as id, 'dose' as kind,
           m.name || CASE WHEN dl.status = 'taken' THEN ' — taken' ELSE ' — skipped' END as text,
           fm.name as familyMemberName,
           dl.logged_at as occurredAt
    FROM dose_logs dl
    JOIN medications m ON m.id = dl.medication_id
    JOIN family_members fm ON fm.id = m.family_member_id

    UNION ALL

    SELECT 'task-' || t.id, 'task',
           t.title || ' — done',
           fm2.name,
           t.completed_at
    FROM tasks t
    LEFT JOIN family_members fm2 ON fm2.id = t.family_member_id
    WHERE t.status = 'done' AND t.completed_at IS NOT NULL

    UNION ALL

    SELECT 'appt-' || a.id, 'appointment',
           a.title || ' — appointment added',
           fm3.name,
           a.created_at
    FROM appointments a
    JOIN family_members fm3 ON fm3.id = a.family_member_id

    UNION ALL

    SELECT 'doc-' || d.id, 'document',
           d.title || ' — document added',
           fm4.name,
           d.created_at
    FROM documents d
    JOIN family_members fm4 ON fm4.id = d.family_member_id

    ORDER BY occurredAt DESC
    LIMIT ?
    `,
    [limit]
  );
}
