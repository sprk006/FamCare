import { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { listCaregivers } from "../../src/db/caregivers";
import { claimTask, completeTask, deleteTask, listTasks, reopenTask, unclaimTask } from "../../src/db/tasks";
import type { Caregiver, TaskWithNames } from "../../src/types/models";
import { GlassCard } from "../../src/theme/GlassCard";
import { ScreenBackground } from "../../src/theme/ScreenBackground";
import { colors, radius, spacing, type } from "../../src/theme/tokens";

function formatDueDate(dueDate: string | null): string | null {
  if (!dueDate) return null;
  const d = new Date(`${dueDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  if (diffDays < 0) return `Overdue — ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  return `Due ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

/** Care Tasks + Family Assignment — a shared to-do list family members can claim. */
export default function TasksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tasks, setTasks] = useState<TaskWithNames[]>([]);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);

  const refresh = useCallback(async () => {
    setTasks(await listTasks());
    setCaregivers(await listCaregivers());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleClaim = (task: TaskWithNames) => {
    if (caregivers.length === 0) {
      router.push({ pathname: "/caregiver/new", params: { returnTaskId: String(task.id) } });
      return;
    }
    Alert.alert(task.title, "Who's doing this?", [
      ...caregivers.map((c) => ({
        text: c.name,
        onPress: async () => {
          await claimTask(task.id, c.id);
          refresh();
        },
      })),
      {
        text: "Someone new…",
        onPress: () =>
          router.push({ pathname: "/caregiver/new", params: { returnTaskId: String(task.id) } }),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleDelete = (task: TaskWithNames) => {
    Alert.alert("Delete this task?", task.title, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await deleteTask(task.id); refresh(); } },
    ]);
  };

  return (
    <ScreenBackground>
      <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.heading}>Tasks</Text>
        <FlatList
          data={tasks}
          keyExtractor={(item) => String(item.id)}
          style={styles.flatList}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.empty}>No tasks yet — everything&apos;s covered.</Text>}
          renderItem={({ item }) => {
            const isDone = item.status === "done";
            const dueLabel = formatDueDate(item.due_date);
            return (
              <GlassCard style={StyleSheet.flatten([styles.card, isDone && styles.cardDone])}>
              <View style={styles.cardMain}>
                <Text style={[styles.cardTitle, isDone && styles.cardTitleDone]}>{item.title}</Text>
                <Text style={styles.cardMeta}>
                  {[item.familyMemberName, dueLabel].filter(Boolean).join(" · ") || "Whole family"}
                </Text>
                {item.claimed_by_id != null && !isDone ? (
                  <Text style={styles.claimedLabel}>Claimed by {item.claimedByName}</Text>
                ) : null}
              </View>

              {isDone ? (
                <Pressable style={styles.textAction} onPress={() => reopenTask(item.id).then(refresh)}>
                  <Text style={styles.textActionLabel}>Reopen</Text>
                </Pressable>
              ) : item.claimed_by_id != null ? (
                <View style={styles.actions}>
                  <Pressable style={styles.doneButton} onPress={() => completeTask(item.id).then(refresh)}>
                    <Text style={styles.doneButtonText}>Done</Text>
                  </Pressable>
                  <Pressable onPress={() => unclaimTask(item.id).then(refresh)}>
                    <Text style={styles.textActionLabel}>Unclaim</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable style={styles.claimButton} onPress={() => handleClaim(item)}>
                  <Text style={styles.claimButtonText}>Claim</Text>
                </Pressable>
              )}

                <Pressable style={styles.deleteIcon} onPress={() => handleDelete(item)}>
                  <Text style={styles.deleteIconText}>×</Text>
                </Pressable>
              </GlassCard>
            );
          }}
        />
        <Pressable style={styles.button} onPress={() => router.push("/task/new")}>
          <Text style={styles.buttonText}>+ Add task</Text>
        </Pressable>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg },
  heading: { ...type.h1, color: colors.ink, marginBottom: spacing.lg },
  flatList: { flex: 1 },
  list: { paddingBottom: 130 },
  empty: { ...type.body, color: colors.faint, marginTop: spacing.xl, textAlign: "center" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardDone: { opacity: 0.6 },
  cardMain: { flex: 1 },
  cardTitle: { ...type.bodyLarge, color: colors.ink },
  cardTitleDone: { textDecorationLine: "line-through" },
  cardMeta: { ...type.caption, color: colors.muted, marginTop: 2 },
  claimedLabel: { ...type.caption, color: colors.sky, marginTop: 2 },
  actions: { alignItems: "flex-end", gap: spacing.xs },
  claimButton: {
    backgroundColor: colors.sage,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  claimButtonText: { ...type.caption, color: colors.white, fontWeight: "700" },
  doneButton: {
    backgroundColor: colors.sage,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  doneButtonText: { ...type.caption, color: colors.white, fontWeight: "700" },
  textAction: { paddingVertical: 2 },
  textActionLabel: { ...type.caption, color: colors.faint },
  deleteIcon: { marginLeft: spacing.sm, padding: spacing.xs },
  deleteIconText: { fontSize: 20, color: colors.faint, lineHeight: 20 },
  button: {
    backgroundColor: colors.panel2,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.md,
  },
  buttonText: { ...type.bodyLarge, color: colors.ink },
});
