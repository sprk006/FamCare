import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getFamilyMemberStatus } from "../../src/db/medications";
import { listFamilyMembers } from "../../src/db/repositories";
import type { FamilyMember, FamilyStatusLevel } from "../../src/types/models";
import { GlassCard } from "../../src/theme/GlassCard";
import { ScreenBackground } from "../../src/theme/ScreenBackground";
import { colors, radius, spacing, status as statusTokens, type } from "../../src/theme/tokens";

interface MemberRow extends FamilyMember {
  status: FamilyStatusLevel;
  lastDoseLoggedAt: string | null;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "No doses logged yet";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Last dose logged just now";
  if (mins < 60) return `Last dose logged ${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `Last dose logged ${hours}h ago`;
  return `Last dose logged ${Math.round(hours / 24)}d ago`;
}

/** FRAME 09 — Family status. Event-driven remote-visibility view. */
export default function FamilyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [rows, setRows] = useState<MemberRow[]>([]);

  const refresh = useCallback(async () => {
    const members = await listFamilyMembers();
    const withStatus = await Promise.all(
      members.map(async (m) => ({ ...m, ...(await getFamilyMemberStatus(m.id)) }))
    );
    setRows(withStatus);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return (
    <ScreenBackground>
      <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
        <View style={styles.headingRow}>
          <Text style={styles.heading}>Family</Text>
          <Pressable onPress={() => router.push("/activity")}>
            <Text style={styles.activityLink}>Activity ›</Text>
          </Pressable>
        </View>
        <FlatList
          data={rows}
          keyExtractor={(item) => String(item.id)}
          style={styles.flatList}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.empty}>No family members yet.</Text>}
          renderItem={({ item }) => {
            const pill = item.status === "on_track" ? statusTokens.on_track : statusTokens.needs_attention;
            return (
              <Pressable onPress={() => router.push(`/member/${item.id}`)}>
                <GlassCard style={styles.card}>
                  <View style={styles.cardMain}>
                    <Text style={styles.cardName}>
                      {item.name}
                      {item.relationship ? ` (${item.relationship})` : ""}
                    </Text>
                    <Text style={styles.cardMeta}>{timeAgo(item.lastDoseLoggedAt)}</Text>
                  </View>
                  <View style={[styles.pill, { backgroundColor: pill.bg }]}>
                    <Text style={[styles.pillText, { color: pill.fg }]}>
                      {item.status === "on_track" ? "On track" : "Needs attention"}
                    </Text>
                  </View>
                </GlassCard>
              </Pressable>
            );
          }}
        />
        <Pressable style={styles.button} onPress={() => router.push("/invite")}>
          <Text style={styles.buttonText}>+ Add a caregiver</Text>
        </Pressable>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  heading: { ...type.h1, color: colors.ink },
  activityLink: { ...type.bodyBold, color: colors.skyDeep },
  flatList: { flex: 1 },
  list: { paddingBottom: 130 },
  empty: { ...type.body, color: colors.faint, marginTop: spacing.xl, textAlign: "center" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardMain: { flex: 1 },
  cardName: { ...type.bodyLarge, color: colors.ink },
  cardMeta: { ...type.caption, color: colors.muted, marginTop: 2 },
  pill: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  pillText: { ...type.caption, fontWeight: "700" },
  button: {
    backgroundColor: colors.sage,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.md,
  },
  buttonText: { ...type.bodyLarge, color: colors.white },
});
