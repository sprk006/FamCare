import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { createFamilyMember } from "../../src/db/repositories";
import { setOnboardingComplete } from "../../src/db/settings";
import { colors, radius, spacing, type } from "../../src/theme/tokens";

const RELATIONSHIPS = ["Parent", "Spouse", "Self", "Other"];

/** FRAME 04 — Add family member. Establishes the household model before any medication is scanned. */
export default function AddMemberScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    const trimmed = name.trim();
    if (!trimmed || !relationship) {
      Alert.alert("Almost there", "Enter a name and choose a relationship.");
      return;
    }
    setSaving(true);
    try {
      const memberId = await createFamilyMember({ name: trimmed, relationship });
      await setOnboardingComplete();
      router.replace({ pathname: "/scan", params: { familyMemberId: String(memberId) } });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Who are you caring for?</Text>

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />

      <View style={styles.chipRow}>
        {RELATIONSHIPS.map((r) => (
          <Pressable
            key={r}
            style={[styles.chip, relationship === r && styles.chipActive]}
            onPress={() => setRelationship(r)}
          >
            <Text style={[styles.chipText, relationship === r && styles.chipTextActive]}>{r}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.button} onPress={handleContinue} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? "Saving..." : "Continue"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper, padding: spacing.xl, paddingTop: 100 },
  title: { ...type.h1, color: colors.ink, marginBottom: spacing.xl },
  input: {
    ...type.bodyLarge,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    color: colors.ink,
    marginBottom: spacing.lg,
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
  button: {
    backgroundColor: colors.sage,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.xxl,
  },
  buttonText: { ...type.bodyLarge, color: colors.white },
});
