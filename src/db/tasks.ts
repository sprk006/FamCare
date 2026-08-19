import { getDb } from "./client";
import type { TaskWithNames } from "../types/models";

const TASK_SELECT = `
  SELECT
    t.*,
    fm.name as familyMemberName,
    cg.name as claimedByName
  FROM tasks t
  LEFT JOIN family_members fm ON fm.id = t.family_member_id
  LEFT JOIN caregivers cg ON cg.id = t.claimed_by_id
`;

/** Open tasks first (unclaimed before claimed, soonest due date first), then done tasks. */
export async function listTasks(): Promise<TaskWithNames[]> {
  const db = await getDb();
  return db.getAllAsync<TaskWithNames>(
    `${TASK_SELECT}
     ORDER BY
       (t.status = 'done') ASC,
       (t.claimed_by_id IS NOT NULL) ASC,
       (t.due_date IS NULL) ASC, t.due_date ASC,
       t.created_at DESC`
  );
}

export async function createTask(input: {
  familyMemberId?: number | null;
  title: string;
  notes?: string;
  dueDate?: string;
}): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO tasks (family_member_id, title, notes, due_date)
     VALUES (?, ?, ?, ?)`,
    [input.familyMemberId ?? null, input.title, input.notes ?? null, input.dueDate ?? null]
  );
  return result.lastInsertRowId;
}

export async function claimTask(taskId: number, caregiverId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE tasks SET claimed_by_id = ? WHERE id = ?`, [caregiverId, taskId]);
}

export async function unclaimTask(taskId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE tasks SET claimed_by_id = NULL WHERE id = ?`, [taskId]);
}

export async function completeTask(taskId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE tasks SET status = 'done', completed_at = datetime('now') WHERE id = ?`,
    [taskId]
  );
}

export async function reopenTask(taskId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE tasks SET status = 'open', completed_at = NULL WHERE id = ?`, [
    taskId,
  ]);
}

export async function deleteTask(taskId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM tasks WHERE id = ?`, [taskId]);
}

export async function countOpenTasks(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) as c FROM tasks WHERE status = 'open'`
  );
  return row?.c ?? 0;
}
