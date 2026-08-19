import { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";

import { getRecentActivity } from "../src/db/activity";
import type { ActivityItem } from "../src/types/models";
import { colors, radius, spacing, type } from "../src/theme/tokens";

const KIND_DOT: Record<ActivityItem["kind"], string> = {
  dose: colors.sage,
  task: colors.gold,
  appointment: colors.sky,
  document: colors.berry,
};

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/** Family Activity feed — a private log of what happened, replacing scattered WhatsApp updates. */
export default function ActivityScreen() {
  const [items, setItems] = useState<ActivityItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      getRecentActivity().then(setItems);
    }, [])
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Nothing logged yet — activity shows up here as it happens.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={[styles.dot, { backgroundColor: KIND_DOT[item.kind] }]} />
            <View style={styles.rowMain}>
              <Text style={styles.rowText}>
                {item.familyMemberName ? `${item.familyMemberName} — ` : ""}
                {item.text}
              </Text>
              <Text style={styles.rowTime}>{timeAgo(item.occurredAt)}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  list: { padding: spacing.lg },
  empty: { ...type.body, color: colors.faint, marginTop: spacing.xl, textAlign: "center" },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  rowMain: { flex: 1 },
  rowText: { ...type.body, color: colors.ink },
  rowTime: { ...type.caption, color: colors.faint, marginTop: 2 },
});
