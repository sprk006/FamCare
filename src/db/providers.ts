import { getDb } from "./client";
import type { Provider, ProviderKind } from "../types/models";

export async function listProviders(kind?: ProviderKind): Promise<Provider[]> {
  const db = await getDb();
  if (kind) {
    return db.getAllAsync<Provider>(
      `SELECT * FROM providers WHERE kind = ? ORDER BY name ASC`,
      [kind]
    );
  }
  return db.getAllAsync<Provider>(`SELECT * FROM providers ORDER BY kind ASC, name ASC`);
}

export async function createProvider(input: {
  kind: ProviderKind;
  name: string;
  specialty?: string;
  phone?: string;
  address?: string;
}): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO providers (kind, name, specialty, phone, address)
     VALUES (?, ?, ?, ?, ?)`,
    [input.kind, input.name, input.specialty ?? null, input.phone ?? null, input.address ?? null]
  );
  return result.lastInsertRowId;
}

export async function deleteProvider(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM providers WHERE id = ?`, [id]);
}
