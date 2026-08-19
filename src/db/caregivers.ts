import { getDb } from "./client";
import type { Caregiver } from "../types/models";

export async function listCaregivers(): Promise<Caregiver[]> {
  const db = await getDb();
  return db.getAllAsync<Caregiver>("SELECT * FROM caregivers ORDER BY name ASC");
}

export async function createCaregiver(input: {
  name: string;
  relationship?: string;
}): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO caregivers (name, relationship) VALUES (?, ?)`,
    [input.name, input.relationship ?? null]
  );
  return result.lastInsertRowId;
}
