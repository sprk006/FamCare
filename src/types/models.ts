export interface FamilyMember {
  id: number;
  name: string;
  relationship: string | null;
  date_of_birth: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type CareCategory =
  | "medication"
  | "appointment"
  | "symptom"
  | "vitals"
  | "note";

export interface CareEntry {
  id: number;
  family_member_id: number;
  category: CareCategory;
  title: string;
  details: string | null;
  occurred_at: string;
  created_at: string;
}

export interface Reminder {
  id: number;
  family_member_id: number;
  title: string;
  due_at: string;
  is_done: 0 | 1;
  notification_id: string | null;
  created_at: string;
}

export type MealRelation = "before_food" | "after_food" | "none";

export interface Medication {
  id: number;
  family_member_id: number;
  name: string;
  dosage: string | null;
  meal_relation: MealRelation;
  schedule_times: string; // JSON-encoded string[] of "HH:MM"
  quantity_per_dose: number;
  total_quantity: number;
  low_stock_threshold_days: number;
  source_image_uri: string | null;
  created_at: string;
  updated_at: string;
}

export type DoseStatus = "pending" | "taken" | "skipped";

export interface DoseLog {
  id: number;
  medication_id: number;
  scheduled_for: string;
  status: "taken" | "skipped";
  logged_at: string;
}

/** A single dose slot for "today", merged from a medication's schedule with any logged status. */
export interface TodayDose {
  medicationId: number;
  medicationName: string;
  dosage: string | null;
  mealRelation: MealRelation;
  scheduledFor: string;
  status: DoseStatus;
}

export interface RefillStatus {
  remaining: number;
  dailyConsumption: number;
  daysRemaining: number | null;
  needsRefill: boolean;
}

export type FamilyStatusLevel = "on_track" | "needs_attention";

// ---------------------------------------------------------------------------
// v4 — Care Tasks + Family Assignment, Appointments, Documents
// ---------------------------------------------------------------------------

/** A local contact who can claim tasks — not an auth identity, just a name. */
export interface Caregiver {
  id: number;
  name: string;
  relationship: string | null;
  created_at: string;
}

export type TaskStatus = "open" | "done";

export interface Task {
  id: number;
  family_member_id: number | null;
  title: string;
  notes: string | null;
  due_date: string | null; // YYYY-MM-DD
  status: TaskStatus;
  claimed_by_id: number | null;
  created_at: string;
  completed_at: string | null;
}

/** A task joined with the names it needs to render without extra queries. */
export interface TaskWithNames extends Task {
  familyMemberName: string | null;
  claimedByName: string | null;
}

export interface Appointment {
  id: number;
  family_member_id: number;
  title: string;
  doctor_name: string | null;
  location: string | null;
  scheduled_for: string; // ISO datetime
  notes: string | null;
  created_at: string;
}

export interface AppointmentWithMember extends Appointment {
  familyMemberName: string;
}

export type DocumentCategory =
  | "prescription"
  | "lab_report"
  | "scan"
  | "insurance"
  | "other";

export interface CareDocument {
  id: number;
  family_member_id: number;
  title: string;
  category: DocumentCategory;
  file_uri: string;
  notes: string | null;
  created_at: string;
}

/** A single entry in the Family Activity feed, merged from several tables. */
export interface ActivityItem {
  id: string; // e.g. "dose-42", "task-7" — unique across sources for list keys
  kind: "dose" | "task" | "appointment" | "document";
  text: string;
  familyMemberName: string | null;
  occurredAt: string; // ISO datetime, used for sorting
}
