import { getDb } from "./client";
import type { CareDocument, DocumentCategory } from "../types/models";

export async function listDocuments(familyMemberId: number): Promise<CareDocument[]> {
  const db = await getDb();
  return db.getAllAsync<CareDocument>(
    `SELECT * FROM documents WHERE family_member_id = ? ORDER BY created_at DESC`,
    [familyMemberId]
  );
}

export async function createDocument(input: {
  familyMemberId: number;
  title: string;
  category: DocumentCategory;
  fileUri: string;
  notes?: string;
}): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO documents (family_member_id, title, category, file_uri, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [input.familyMemberId, input.title, input.category, input.fileUri, input.notes ?? null]
  );
  return result.lastInsertRowId;
}

export async function deleteDocument(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM documents WHERE id = ?`, [id]);
}
