import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { listFamilyMembers } from "../../src/db/repositories";
import { createTask } from "../../src/db/tasks";
import type { FamilyMember } from "../../src/types/models";
import { colors, radius, spacing, type } from "../../src/theme/tokens";

/** Add a task — belongs to one family member, or the whole family (no member picked). */
export default function NewTaskScreen() {
  const router = useRouter();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  useFocusEffect(
    useCallback(() => {
      listFamilyMembers().then(setMembers);
    }, [])
  );

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    const trimmedDate = dueDate.trim();
    if (trimmedDate && !/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
      Alert.alert("Check the due date", "Enter it as YYYY-MM-DD, or leave it blank.");
      return;
    }
    await createTask({
      familyMemberId: memberId,
      title: trimmedTitle,
      dueDate: trimmedDate || undefined,
      notes: notes.trim() || undefined,
    });
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Add a task</Text>

      <TextInput
        style={styles.input}
        placeholder="e.g. Refill Dad's Metformin"
        value={title}
        onChangeText={setTitle}
        autoFocus
      />

      <Text style={styles.label}>Who's this for?</Text>
      <View style={styles.chipRow}>
        <Pressable
          style={[styles.chip, memberId === null && styles.chipActive]}
          onPress={() => setMemberId(null)}
        >
          <Text style={[styles.chipText, memberId === null && styles.chipTextActive]}>
            Whole family
          </Text>
        </Pressable>
        {members.map((m) => (
          <Pressable
            key={m.id}
            style={[styles.chip, memberId === m.id && styles.chipActive]}
            onPress={() => setMemberId(m.id)}
          >
            <Text style={[styles.chipText, memberId === m.id && styles.chipTextActive]}>
              {m.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Due date (optional) — YYYY-MM-DD"
        value={dueDate}
        onChangeText={setDueDate}
      />
      <TextInput
        style={[styles.input, styles.notesInput]}
        placeholder="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <Pressable style={styles.button} onPress={handleSave} disabled={!title.trim()}>
        <Text style={styles.buttonText}>Add task</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.xl, paddingTop: 40, paddingBottom: 60 },
  title: { ...type.h1, color: colors.ink, marginBottom: spacing.lg },
  label: { ...type.caption, color: colors.muted, marginBottom: spacing.sm },
  input: {
    ...type.bodyLarge,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.ink,
    marginBottom: spacing.lg,
  },
  notesInput: { minHeight: 80, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
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
    marginTop: spacing.sm,
  },
  buttonText: { ...type.bodyLarge, color: colors.white },
});
