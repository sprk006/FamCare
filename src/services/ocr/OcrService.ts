/**
 * OcrService — extracts a medication draft from a photo of a strip or
 * prescription.
 *
 * Stubbed for now, same pattern as SlmService: this returns an empty draft
 * so the confirm-medication screen can be built and tested end-to-end
 * before a real OCR engine is wired in. Swap `extractMedicationDraft` for
 * an implementation backed by one of:
 *
 * - @react-native-ml-kit/text-recognition (on-device, offline)
 * - A cloud vision API (requires a network call — decide deliberately,
 *   since FamCare's default posture is "nothing leaves the device")
 */

export interface MedicationDraft {
  name: string;
  dosage: string;
}

export async function extractMedicationDraft(_imageUri: string): Promise<MedicationDraft> {
  // Simulate OCR processing latency so calling code already handles the
  // async path it will need once real extraction runs here.
  await new Promise((resolve) => setTimeout(resolve, 300));
  return { name: "", dosage: "" };
}
