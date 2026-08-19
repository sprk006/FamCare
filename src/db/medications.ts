import { getDb } from "./client";
import type {
  DoseStatus,
  FamilyStatusLevel,
  MealRelation,
  Medication,
  RefillStatus,
  TodayDose,
} from "../types/models";

const GRACE_MS = 60 * 60 * 1000; // a dose isn't "overdue" until an hour past its slot

function todayDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Medications
// ---------------------------------------------------------------------------

export async function listMedications(familyMemberId: number): Promise<Medication[]> {
  const db = await getDb();
  return db.getAllAsync<Medication>(
    `SELECT * FROM medications WHERE family_member_id = ? ORDER BY name ASC`,
    [familyMemberId]
  );
}

export async function getMedication(id: number): Promise<Medication | null> {
  const db = await getDb();
  return db.getFirstAsync<Medication>(`SELECT * FROM medications WHERE id = ?`, [id]);
}

export async function createMedication(input: {
  familyMemberId: number;
  name: string;
  dosage?: string;
  mealRelation: MealRelation;
  scheduleTimes: string[];
  quantityPerDose: number;
  totalQuantity: number;
  lowStockThresholdDays?: number;
  sourceImageUri?: string;
}): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO medications
      (family_member_id, name, dosage, meal_relation, schedule_times, quantity_per_dose, total_quantity, low_stock_threshold_days, source_image_uri)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.familyMemberId,
      input.name,
      input.dosage ?? null,
      input.mealRelation,
      JSON.stringify(input.scheduleTimes),
      input.quantityPerDose,
      input.totalQuantity,
      input.lowStockThresholdDays ?? 3,
      input.sourceImageUri ?? null,
    ]
  );
  return result.lastInsertRowId;
}

export async function setMedicationAlarmIds(id: number, alarmIds: string[]): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE medications SET alarm_ids = ? WHERE id = ?`, [
    JSON.stringify(alarmIds),
    id,
  ]);
}

export async function deleteMedication(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM medications WHERE id = ?`, [id]);
}

// ---------------------------------------------------------------------------
// Today's doses + logging
// ---------------------------------------------------------------------------

export async function getTodayDoses(familyMemberId: number): Promise<TodayDose[]> {
  const db = await getDb();
  const meds = await listMedications(familyMemberId);
  const dateStr = todayDateStr();
  const doses: TodayDose[] = [];

  for (const med of meds) {
    let times: string[] = [];
    try {
      times = JSON.parse(med.schedule_times);
    } catch {
      times = [];
    }

    for (const time of times) {
      const scheduledFor = `${dateStr}T${time}:00`;
      const log = await db.getFirstAsync<{ status: DoseStatus }>(
        `SELECT status FROM dose_logs WHERE medication_id = ? AND scheduled_for = ?`,
        [med.id, scheduledFor]
      );
      doses.push({
        medicationId: med.id,
        medicationName: med.name,
        dosage: med.dosage,
        mealRelation: med.meal_relation,
        scheduledFor,
        status: log?.status ?? "pending",
      });
    }
  }

  doses.sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
  return doses;
}

export async function logDose(input: {
  medicationId: number;
  scheduledFor: string;
  status: "taken" | "skipped";
}): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO dose_logs (medication_id, scheduled_for, status, logged_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(medication_id, scheduled_for)
     DO UPDATE SET status = excluded.status, logged_at = excluded.logged_at`,
    [input.medicationId, input.scheduledFor, input.status]
  );
}

// ---------------------------------------------------------------------------
// Refill prediction — consumption-based (counts logged "taken" doses),
// not calendar-based (not just "N days since the pack was added").
// ---------------------------------------------------------------------------

export async function getRefillStatus(med: Medication): Promise<RefillStatus> {
  const db = await getDb();
  const takenRow = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) as c FROM dose_logs WHERE medication_id = ? AND status = 'taken'`,
    [med.id]
  );
  const takenCount = takenRow?.c ?? 0;
  const remaining = Math.max(0, med.total_quantity - takenCount * med.quantity_per_dose);

  let times: string[] = [];
  try {
    times = JSON.parse(med.schedule_times);
  } catch {
    times = [];
  }
  const dailyConsumption = times.length * med.quantity_per_dose;
  const daysRemaining = dailyConsumption > 0 ? remaining / dailyConsumption : null;
  const needsRefill = daysRemaining != null && daysRemaining <= med.low_stock_threshold_days;

  return { remaining, dailyConsumption, daysRemaining, needsRefill };
}

export interface MedicationWithStatus extends Medication {
  familyMemberName: string;
  refill: RefillStatus;
}

export async function listAllMedicationsWithStatus(): Promise<MedicationWithStatus[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Medication & { familyMemberName: string }>(
    `SELECT m.*, fm.name as familyMemberName
     FROM medications m
     JOIN family_members fm ON fm.id = m.family_member_id
     ORDER BY m.name ASC`
  );
  const withStatus: MedicationWithStatus[] = [];
  for (const row of rows) {
    const refill = await getRefillStatus(row);
    withStatus.push({ ...row, refill });
  }
  withStatus.sort((a, b) => (a.refill.daysRemaining ?? Infinity) - (b.refill.daysRemaining ?? Infinity));
  return withStatus;
}

// ---------------------------------------------------------------------------
// Family status (for the Family tab)
// ---------------------------------------------------------------------------

export async function getFamilyMemberStatus(familyMemberId: number): Promise<{
  status: FamilyStatusLevel;
  lastDoseLoggedAt: string | null;
}> {
  const db = await getDb();
  const doses = await getTodayDoses(familyMemberId);
  const now = Date.now();
  const overdue = doses.some(
    (d) => d.status === "pending" && new Date(d.scheduledFor).getTime() + GRACE_MS < now
  );

  const lastLog = await db.getFirstAsync<{ logged_at: string }>(
    `SELECT dl.logged_at as logged_at
     FROM dose_logs dl
     JOIN medications m ON m.id = dl.medication_id
     WHERE m.family_member_id = ?
     ORDER BY dl.logged_at DESC LIMIT 1`,
    [familyMemberId]
  );

  return {
    status: overdue ? "needs_attention" : "on_track",
    lastDoseLoggedAt: lastLog?.logged_at ?? null,
  };
}
