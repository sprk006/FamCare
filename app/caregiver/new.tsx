import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { createCaregiver } from "../../src/db/caregivers";
import { claimTask } from "../../src/db/tasks";
import { colors, radius, spacing, type } from "../../src/theme/tokens";

/** Quick-add for the local caregiver list — reached from a task's "Claim" picker. */
export default function NewCaregiverScreen() {
  const router = useRouter();
  const { returnTaskId } = useLocalSearchParams<{ returnTaskId?: string }>();
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const caregiverId = await createCaregiver({
      name: trimmed,
      relationship: relationship.trim() || undefined,
    });
    if (returnTaskId) {
      await claimTask(Number(returnTaskId), caregiverId);
    }
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add a caregiver</Text>
      <Text style={styles.body}>
        A local name for who's helping out — not an account, just so tasks can show who's
        doing what.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
        autoFocus
      />
      <TextInput
        style={styles.input}
        placeholder="Relationship (optional) — e.g. Sister"
        value={relationship}
        onChangeText={setRelationship}
      />
      <Pressable style={styles.button} onPress={handleSave} disabled={!name.trim()}>
        <Text style={styles.buttonText}>
          {returnTaskId ? "Add & claim task" : "Add caregiver"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper, padding: spacing.xl, paddingTop: 40 },
  title: { ...type.h1, color: colors.ink, marginBottom: spacing.sm },
  body: { ...type.body, color: colors.muted, marginBottom: spacing.xl },
  input: {
    ...type.bodyLarge,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  button: {
    backgroundColor: colors.sage,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  buttonText: { ...type.bodyLarge, color: colors.white },
});
