import { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { createMedication } from "../src/db/medications";
import { searchMedicineReference, type MedicineReferenceEntry } from "../src/data/medicineReference";
import type { MealRelation } from "../src/types/models";
import { colors, radius, spacing, type } from "../src/theme/tokens";

const MEAL_OPTIONS: { value: MealRelation; label: string }[] = [
  { value: "before_food", label: "Before food" },
  { value: "after_food", label: "After food" },
  { value: "none", label: "Anytime" },
];

/**
 * FRAME 06 — Confirm medication. Human-in-the-loop check on OCR output
 * before the schedule + refill prediction are built on it.
 */
export default function ConfirmMedicationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    familyMemberId: string;
    imageUri?: string;
    name?: string;
    dosage?: string;
  }>();

  const [name, setName] = useState(params.name ?? "");
  const [suggestions, setSuggestions] = useState<MedicineReferenceEntry[]>([]);
  const [dosage, setDosage] = useState(params.dosage ?? "");
  const [mealRelation, setMealRelation] = useState<MealRelation>("after_food");
  const [times, setTimes] = useState<string[]>(["08:00"]);
  const [newTime, setNewTime] = useState("");
  const [quantityPerDose, setQuantityPerDose] = useState("1");
  const [totalQuantity, setTotalQuantity] = useState("28");
  const [saving, setSaving] = useState(false);

  const handleNameChange = (value: string) => {
    setName(value);
    setSuggestions(searchMedicineReference(value));
  };

  const pickSuggestion = (entry: MedicineReferenceEntry) => {
    setName(entry.name);
    if (!dosage.trim() && entry.commonStrengths[0] && entry.commonStrengths[0] !== "—") {
      setDosage(entry.commonStrengths[0]);
    }
    setSuggestions([]);
  };

  const addTime = () => {
    const trimmed = newTime.trim();
    if (!/^\d{2}:\d{2}$/.test(trimmed)) {
      Alert.alert("Check the time", "Enter a time as HH:MM, e.g. 08:00.");
      return;
    }
    setTimes((prev) => [...prev, trimmed].sort());
    setNewTime("");
  };

  const removeTime = (time: string) => {
    setTimes((prev) => prev.filter((t) => t !== time));
  };

  const handleSave = async () => {
    const familyMemberId = Number(params.familyMemberId);
    const trimmedName = name.trim();
    const perDose = Number(quantityPerDose);
    const total = Number(totalQuantity);

    if (!Number.isFinite(familyMemberId)) {
      Alert.alert("Missing family member", "Go back and start again from a family member's page.");
      return;
    }
    if (!trimmedName || times.length === 0 || !Number.isFinite(perDose) || perDose <= 0) {
      Alert.alert("Check the details", "Enter a name, at least one time, and a valid dose amount.");
      return;
    }

    setSaving(true);
    try {
      await createMedication({
        familyMemberId,
        name: trimmedName,
        dosage: dosage.trim() || undefined,
        mealRelation,
        scheduleTimes: times,
        quantityPerDose: perDose,
        totalQuantity: Number.isFinite(total) ? total : 0,
        sourceImageUri: params.imageUri || undefined,
      });
      router.replace("/(tabs)/home");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Confirm details</Text>

      {params.imageUri ? (
        <Image source={{ uri: params.imageUri }} style={styles.preview} />
      ) : null}

      <Text style={styles.label}>Medication name</Text>
      <TextInput
        style={styles.input}
        placeholder="Metformin 500mg"
        value={name}
        onChangeText={handleNameChange}
      />
      {suggestions.length > 0 ? (
        <View style={styles.suggestionBox}>
          {suggestions.map((entry) => (
            <Pressable
              key={entry.name}
              style={styles.suggestionRow}
              onPress={() => pickSuggestion(entry)}
            >
              <Text style={styles.suggestionName}>{entry.name}</Text>
              <Text style={styles.suggestionMeta}>
                {entry.category}
                {entry.commonStrengths[0] !== "—" ? ` · ${entry.commonStrengths.join(", ")}` : ""}
              </Text>
            </Pressable>
          ))}
          <Text style={styles.suggestionDisclaimer}>
            Reference list only — confirm against the prescription label or your pharmacist.
          </Text>
        </View>
      ) : null}

      <Text style={styles.label}>Dosage</Text>
      <TextInput
        style={styles.input}
        placeholder="500mg"
        value={dosage}
        onChangeText={setDosage}
      />

      <Text style={styles.label}>Meal relation</Text>
      <View style={styles.chipRow}>
        {MEAL_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            style={[styles.chip, mealRelation === opt.value && styles.chipActive]}
            onPress={() => setMealRelation(opt.value)}
          >
            <Text style={[styles.chipText, mealRelation === opt.value && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Times per day</Text>
      <View style={styles.chipRow}>
        {times.map((t) => (
          <Pressable key={t} style={styles.timeChip} onPress={() => removeTime(t)}>
            <Text style={styles.timeChipText}>{t} ✕</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.rowInput]}
          placeholder="HH:MM"
          value={newTime}
          onChangeText={setNewTime}
        />
        <Pressable style={styles.addTimeButton} onPress={addTime}>
          <Text style={styles.addTimeButtonText}>Add</Text>
        </Pressable>
      </View>

      <View style={styles.row}>
        <View style={styles.rowInput}>
          <Text style={styles.label}>Amount per dose</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={quantityPerDose}
            onChangeText={setQuantityPerDose}
          />
        </View>
        <View style={styles.rowInput}>
          <Text style={styles.label}>Pack size (tablets)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={totalQuantity}
            onChangeText={setTotalQuantity}
          />
        </View>
      </View>

      <Pressable style={styles.button} onPress={handleSave} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? "Saving..." : "Save medication"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.xl, paddingTop: 40, paddingBottom: 60 },
  title: { ...type.h1, color: colors.ink, marginBottom: spacing.lg },
  preview: { height: 160, borderRadius: radius.lg, marginBottom: spacing.lg, backgroundColor: colors.panel2 },
  label: { ...type.caption, color: colors.muted, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    ...type.bodyLarge,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.ink,
  },
  suggestionBox: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    marginTop: spacing.xs,
    overflow: "hidden",
  },
  suggestionRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  suggestionName: { ...type.bodyLarge, color: colors.ink },
  suggestionMeta: { ...type.caption, color: colors.muted, marginTop: 1 },
  suggestionDisclaimer: {
    ...type.caption,
    color: colors.faint,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.sage, borderColor: colors.sage },
  chipText: { ...type.body, color: colors.muted },
  chipTextActive: { color: colors.white, fontWeight: "700" },
  timeChip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.panel2,
  },
  timeChipText: { ...type.caption, color: colors.ink },
  row: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-end" },
  rowInput: { flex: 1 },
  addTimeButton: {
    backgroundColor: colors.sky,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    justifyContent: "center",
  },
  addTimeButtonText: { ...type.bodyLarge, color: colors.white },
  button: {
    backgroundColor: colors.sage,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.xxl,
  },
  buttonText: { ...type.bodyLarge, color: colors.white },
});
