/**
 * A small curated list of common medicine names for the confirm-medication
 * autocomplete — generic names and typical strengths that appear on any
 * pharmacy shelf, not sourced from a clinical/licensed drug database.
 *
 * IMPORTANT: this is a name/strength convenience list only. It carries no
 * dosing guidance, interaction data, or contraindication information, and
 * must not be treated as clinical advice — always confirm against the
 * prescription label or a pharmacist. (FamCare's MVP scope explicitly
 * excludes a drug-interaction checker for exactly this reason — see
 * design/investor_dashboard_v2.html, Part 08.)
 */

export interface MedicineReferenceEntry {
  name: string;
  category: string;
  commonStrengths: string[];
}

export const MEDICINE_REFERENCE: MedicineReferenceEntry[] = [
  { name: "Paracetamol", category: "Pain relief / fever", commonStrengths: ["500mg", "650mg"] },
  { name: "Ibuprofen", category: "Pain relief", commonStrengths: ["200mg", "400mg"] },
  { name: "Diclofenac", category: "Pain relief", commonStrengths: ["50mg"] },
  { name: "Aspirin", category: "Pain relief / cardiac", commonStrengths: ["75mg", "150mg"] },
  { name: "Metformin", category: "Diabetes", commonStrengths: ["500mg", "850mg", "1000mg"] },
  { name: "Glimepiride", category: "Diabetes", commonStrengths: ["1mg", "2mg", "4mg"] },
  { name: "Sitagliptin", category: "Diabetes", commonStrengths: ["50mg", "100mg"] },
  { name: "Empagliflozin", category: "Diabetes", commonStrengths: ["10mg", "25mg"] },
  { name: "Insulin Glargine", category: "Diabetes", commonStrengths: ["100 IU/mL"] },
  { name: "Amlodipine", category: "Blood pressure", commonStrengths: ["2.5mg", "5mg", "10mg"] },
  { name: "Telmisartan", category: "Blood pressure", commonStrengths: ["20mg", "40mg", "80mg"] },
  { name: "Losartan", category: "Blood pressure", commonStrengths: ["25mg", "50mg"] },
  { name: "Enalapril", category: "Blood pressure", commonStrengths: ["2.5mg", "5mg", "10mg"] },
  { name: "Ramipril", category: "Blood pressure", commonStrengths: ["2.5mg", "5mg"] },
  { name: "Metoprolol", category: "Blood pressure / cardiac", commonStrengths: ["25mg", "50mg"] },
  { name: "Hydrochlorothiazide", category: "Blood pressure", commonStrengths: ["12.5mg", "25mg"] },
  { name: "Furosemide", category: "Diuretic", commonStrengths: ["20mg", "40mg"] },
  { name: "Atorvastatin", category: "Cholesterol", commonStrengths: ["10mg", "20mg", "40mg"] },
  { name: "Rosuvastatin", category: "Cholesterol", commonStrengths: ["5mg", "10mg", "20mg"] },
  { name: "Clopidogrel", category: "Cardiac", commonStrengths: ["75mg"] },
  { name: "Digoxin", category: "Cardiac", commonStrengths: ["0.25mg"] },
  { name: "Levothyroxine", category: "Thyroid", commonStrengths: ["25mcg", "50mcg", "100mcg"] },
  { name: "Omeprazole", category: "Acidity / gastric", commonStrengths: ["20mg", "40mg"] },
  { name: "Pantoprazole", category: "Acidity / gastric", commonStrengths: ["20mg", "40mg"] },
  { name: "Ranitidine", category: "Acidity / gastric", commonStrengths: ["150mg"] },
  { name: "Domperidone", category: "Nausea / gastric", commonStrengths: ["10mg"] },
  { name: "Cetirizine", category: "Allergy", commonStrengths: ["10mg"] },
  { name: "Levocetirizine", category: "Allergy", commonStrengths: ["5mg"] },
  { name: "Montelukast", category: "Allergy / asthma", commonStrengths: ["4mg", "10mg"] },
  { name: "Salbutamol", category: "Asthma (inhaler)", commonStrengths: ["100mcg/dose"] },
  { name: "Amoxicillin", category: "Antibiotic", commonStrengths: ["250mg", "500mg"] },
  { name: "Azithromycin", category: "Antibiotic", commonStrengths: ["250mg", "500mg"] },
  { name: "Ciprofloxacin", category: "Antibiotic", commonStrengths: ["250mg", "500mg"] },
  { name: "Doxycycline", category: "Antibiotic", commonStrengths: ["100mg"] },
  { name: "Metronidazole", category: "Antibiotic", commonStrengths: ["400mg"] },
  { name: "Alprazolam", category: "Anxiety", commonStrengths: ["0.25mg", "0.5mg"] },
  { name: "Escitalopram", category: "Mental health", commonStrengths: ["5mg", "10mg"] },
  { name: "Sertraline", category: "Mental health", commonStrengths: ["25mg", "50mg"] },
  { name: "Gabapentin", category: "Nerve pain", commonStrengths: ["100mg", "300mg"] },
  { name: "Tramadol", category: "Pain relief", commonStrengths: ["50mg"] },
  { name: "Folic Acid", category: "Supplement", commonStrengths: ["5mg"] },
  { name: "Ferrous Sulfate", category: "Supplement (iron)", commonStrengths: ["200mg"] },
  { name: "Vitamin D3", category: "Supplement", commonStrengths: ["60000 IU"] },
  { name: "Calcium + Vitamin D3", category: "Supplement", commonStrengths: ["500mg"] },
  { name: "Vitamin B Complex", category: "Supplement", commonStrengths: ["—"] },
  { name: "Multivitamin", category: "Supplement", commonStrengths: ["—"] },
];

export function searchMedicineReference(query: string, limit = 6): MedicineReferenceEntry[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];
  return MEDICINE_REFERENCE.filter((entry) => entry.name.toLowerCase().includes(trimmed)).slice(
    0,
    limit
  );
}
