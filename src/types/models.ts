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
