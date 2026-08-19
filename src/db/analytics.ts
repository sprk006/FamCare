import { getDb } from "./client";
import { listMedications } from "./medications";
import type { DoseStatus } from "../types/models";

const GRACE_MS = 60 * 60 * 1000;

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseTimes(schedule: string): string[] {
  try {
    const t = JSON.parse(schedule);
    return Array.isArray(t) ? t : [];
  } catch {
    return [];
  }
}

export interface AdherenceSummary {
  taken: number;
  skipped: number;
  missed: number;
  pending: number;
  scored: number; // taken + skipped + missed (past, gradeable slots)
  adherencePct: number; // taken / scored, 0 if none
}

export interface DayCell {
  date: string; // YYYY-MM-DD
  taken: number;
  total: number; // scored slots that day (past)
  future: boolean;
}

/**
 * Loads every dose_log for a member's meds into a Map keyed by
 * `${medicationId}|${scheduledFor}` so the grid/summary computations below
 * don't hit the DB per-slot.
 */
async function loadLogMap(medicationIds: number[]): Promise<Map<string, DoseStatus>> {
  const map = new Map<string, DoseStatus>();
  if (medicationIds.length === 0) return map;
  const db = await getDb();
  const placeholders = medicationIds.map(() => "?").join(",");
  const rows = await db.getAllAsync<{ medication_id: number; scheduled_for: string; status: DoseStatus }>(
    `SELECT medication_id, scheduled_for, status FROM dose_logs WHERE medication_id IN (${placeholders})`,
    medicationIds
  );
  for (const r of rows) map.set(`${r.medication_id}|${r.scheduled_for}`, r.status);
  return map;
}

/** Adherence across all of a member's meds over the last `days` days (incl. today). */
export async function getMemberAdherence(memberId: number, days = 30): Promise<AdherenceSummary> {
  const meds = await listMedications(memberId);
  const logMap = await loadLogMap(meds.map((m) => m.id));
  const now = Date.now();

  let taken = 0, skipped = 0, missed = 0, pending = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = dateStr(d);
    for (const med of meds) {
      // Only count days on/after the med was added.
      if (ds < med.created_at.slice(0, 10)) continue;
      for (const time of parseTimes(med.schedule_times)) {
        const scheduledFor = `${ds}T${time}:00`;
        const logged = logMap.get(`${med.id}|${scheduledFor}`);
        if (logged === "taken") taken++;
        else if (logged === "skipped") skipped++;
        else if (new Date(scheduledFor).getTime() + GRACE_MS < now) missed++;
        else pending++;
      }
    }
  }
  const scored = taken + skipped + missed;
  return { taken, skipped, missed, pending, scored, adherencePct: scored ? taken / scored : 0 };
}

/** Consecutive days (ending today or the most recent gradeable day) where every scheduled dose was taken. */
export async function getMemberStreak(memberId: number): Promise<number> {
  const meds = await listMedications(memberId);
  if (meds.length === 0) return 0;
  const logMap = await loadLogMap(meds.map((m) => m.id));
  const now = Date.now();

  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = dateStr(d);

    let scored = 0, taken = 0;
    for (const med of meds) {
      if (ds < med.created_at.slice(0, 10)) continue;
      for (const time of parseTimes(med.schedule_times)) {
        const scheduledFor = `${ds}T${time}:00`;
        const past = new Date(scheduledFor).getTime() + GRACE_MS < now;
        const logged = logMap.get(`${med.id}|${scheduledFor}`);
        if (logged === "taken") { taken++; scored++; }
        else if (logged === "skipped") { scored++; }
        else if (past) { scored++; } // a missed dose breaks the streak
      }
    }
    if (scored === 0) {
      // No gradeable doses this day (e.g. today's slots still upcoming) — skip
      // it without breaking the streak, unless we're past the first day.
      if (i === 0) continue;
      continue;
    }
    if (taken === scored) streak++;
    else break;
  }
  return streak;
}

/** Per-day taken/total cells for the last `days` days — feeds the weekly/monthly grid. */
export async function getMemberDayGrid(memberId: number, days: number): Promise<DayCell[]> {
  const meds = await listMedications(memberId);
  const logMap = await loadLogMap(meds.map((m) => m.id));
  const now = Date.now();
  const cells: DayCell[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = dateStr(d);
    let taken = 0, total = 0, future = false;
    for (const med of meds) {
      if (ds < med.created_at.slice(0, 10)) continue;
      for (const time of parseTimes(med.schedule_times)) {
        const scheduledFor = `${ds}T${time}:00`;
        const past = new Date(scheduledFor).getTime() + GRACE_MS < now;
        const logged = logMap.get(`${med.id}|${scheduledFor}`);
        if (logged === "taken") { taken++; total++; }
        else if (logged === "skipped") { total++; }
        else if (past) { total++; }
        else { future = true; }
      }
    }
    cells.push({ date: ds, taken, total, future });
  }
  return cells;
}

/** Per-medication day grid (taken/total per day) for the last `days` days — the med checklist. */
export async function getMedicationDayGrid(medicationId: number, days: number): Promise<DayCell[]> {
  const db = await getDb();
  const med = await db.getFirstAsync<{ schedule_times: string; created_at: string }>(
    `SELECT schedule_times, created_at FROM medications WHERE id = ?`,
    [medicationId]
  );
  if (!med) return [];
  const logMap = await loadLogMap([medicationId]);
  const times = parseTimes(med.schedule_times);
  const now = Date.now();
  const cells: DayCell[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = dateStr(d);
    let taken = 0, total = 0, future = false;
    if (ds >= med.created_at.slice(0, 10)) {
      for (const time of times) {
        const scheduledFor = `${ds}T${time}:00`;
        const past = new Date(scheduledFor).getTime() + GRACE_MS < now;
        const logged = logMap.get(`${medicationId}|${scheduledFor}`);
        if (logged === "taken") { taken++; total++; }
        else if (logged === "skipped") { total++; }
        else if (past) { total++; }
        else { future = true; }
      }
    }
    cells.push({ date: ds, taken, total, future });
  }
  return cells;
}

export interface MemberInsight {
  memberId: number;
  name: string;
  relationship: string | null;
  medsCount: number;
  weekAdherence: AdherenceSummary;
  monthAdherence: AdherenceSummary;
  streak: number;
}

export async function getAllMemberInsights(): Promise<MemberInsight[]> {
  const db = await getDb();
  const members = await db.getAllAsync<{ id: number; name: string; relationship: string | null }>(
    `SELECT id, name, relationship FROM family_members ORDER BY name ASC`
  );
  const out: MemberInsight[] = [];
  for (const m of members) {
    const meds = await listMedications(m.id);
    out.push({
      memberId: m.id,
      name: m.name,
      relationship: m.relationship,
      medsCount: meds.length,
      weekAdherence: await getMemberAdherence(m.id, 7),
      monthAdherence: await getMemberAdherence(m.id, 30),
      streak: await getMemberStreak(m.id),
    });
  }
  return out;
}
