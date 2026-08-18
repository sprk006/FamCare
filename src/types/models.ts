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
  created_at: string;
}
