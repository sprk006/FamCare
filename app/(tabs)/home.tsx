import { useCallback, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { getRefillStatus, getTodayDoses, listMedications, logDose } from "../../src/db/medications";
import { listFamilyMembers } from "../../src/db/repositories";
import type { FamilyMember, TodayDose } from "../../src/types/models";
import { colors, radius, spacing, type } from "../../src/theme/tokens";

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function mealLabel(relation: TodayDose["mealRelation"]): string {
  if (relation === "before_food") return "Before food";
  if (relation === "after_food") return "After food";
  return "Anytime";
}

/** FRAME 07 — Home / Today. The daily-return screen: dose list with 1-tap mark taken/skipped. */
export default function HomeScreen() {
  const router = useRouter();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [doses, setDoses] = useState<TodayDose[]>([]);
  const [refillAlert, setRefillAlert] = useState<{ name: string; daysRemaining: number } | null>(
    null
  );

  const loadForMember = useCallback(async (memberId: number) => {
    setDoses(await getTodayDoses(memberId));

    const meds = await listMedications(memberId);
    let worst: { name: string; daysRemaining: number } | null = null;
    for (const med of meds) {
      const refill = await getRefillStatus(med);
      if (refill.needsRefill && refill.daysRemaining != null) {
        if (!worst || refill.daysRemaining < worst.daysRemaining) {
          worst = { name: med.name, daysRemaining: Math.round(refill.daysRemaining) };
        }
      }
    }
    setRefillAlert(worst);
  }, []);

  const refresh = useCallback(async () => {
    const list = await listFamilyMembers();
    setMembers(list);
    const current =
      activeId != null && list.some((m) => m.id === activeId) ? activeId : list[0]?.id ?? null;
    setActiveId(current);

    if (current == null) {
      setDoses([]);
      setRefillAlert(null);
      return;
    }
    await loadForMember(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, loadForMember]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const selectMember = (memberId: number) => {
    setActiveId(memberId);
    loadForMember(memberId);
  };

  const handleMark = async (dose: TodayDose, newStatus: "taken" | "skipped") => {
    await logDose({ medicationId: dose.medicationId, scheduledFor: dose.scheduledFor, status: newStatus });
    if (activeId != null) loadForMember(activeId);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.memberRow}
        contentContainerStyle={styles.memberRowContent}
      >
        {members.map((m) => (
          <Pressable key={m.id} onPress={() => selectMember(m.id)} style={styles.memberChip}>
            <View style={[styles.avatar, activeId === m.id && styles.avatarActive]}>
              <Text style={[styles.avatarText, activeId === m.id && styles.avatarTextActive]}>
                {initials(m.name)}
              </Text>
            </View>
            <Text style={styles.memberName} numberOfLines={1}>
              {m.name}
            </Text>
          </Pressable>
        ))}
        <Pressable style={styles.addMemberChip} onPress={() => router.push("/onboarding/add-member")}>
          <Text style={styles.addMemberChipText}>+</Text>
        </Pressable>
      </ScrollView>

      {refillAlert ? (
        <Pressable style={styles.refillBanner} onPress={() => router.push("/(tabs)/refills")}>
          <Text style={styles.refillBannerText}>
            {refillAlert.name} runs out in {refillAlert.daysRemaining} day
            {refillAlert.daysRemaining === 1 ? "" : "s"}
          </Text>
        </Pressable>
      ) : null}

      <FlatList
        data={doses}
        keyExtractor={(item) => `${item.medicationId}-${item.scheduledFor}`}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No medications scheduled yet.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardMain}>
              <Text style={styles.cardTime}>{formatTime(item.scheduledFor)}</Text>
              <Text style={styles.cardTitle}>
                {item.medicationName}
                {item.dosage ? ` — ${item.dosage}` : ""}
              </Text>
              <Text style={styles.cardMeta}>{mealLabel(item.mealRelation)}</Text>
            </View>
            {item.status === "pending" ? (
              <View style={styles.actions}>
                <Pressable style={styles.takenButton} onPress={() => handleMark(item, "taken")}>
                  <Text style={styles.takenButtonText}>Mark taken</Text>
                </Pressable>
                <Pressable onPress={() => handleMark(item, "skipped")}>
                  <Text style={styles.skipText}>Skip</Text>
                </Pressable>
              </View>
            ) : (
              <Text style={[styles.doneLabel, item.status === "skipped" && styles.skippedLabel]}>
                {item.status === "taken" ? "Taken" : "Skipped"}
              </Text>
            )}
          </View>
        )}
      />

      <Pressable
        style={styles.scanButton}
        onPress={() =>
          activeId != null &&
          router.push({ pathname: "/scan", params: { familyMemberId: String(activeId) } })
        }
      >
        <Text style={styles.scanButtonText}>+ Scan new medication</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper, paddingTop: spacing.lg },
  memberRow: { flexGrow: 0, paddingHorizontal: spacing.lg },
  memberRowContent: { gap: spacing.md, paddingRight: spacing.lg },
  memberChip: { alignItems: "center", width: 64 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.panel2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarActive: { backgroundColor: colors.sage },
  avatarText: { ...type.bodyLarge, color: colors.muted },
  avatarTextActive: { color: colors.white },
  memberName: { ...type.caption, color: colors.muted, marginTop: spacing.xs, textAlign: "center" },
  addMemberChip: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  addMemberChipText: { ...type.h2, color: colors.faint },
  refillBanner: {
    backgroundColor: "#E6F3FA",
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  refillBannerText: { ...type.bodyLarge, color: colors.sky },
  list: { padding: spacing.lg, paddingBottom: 12 },
  empty: { ...type.body, color: colors.faint, marginTop: spacing.xl, textAlign: "center" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
  cardMain: { flex: 1 },
  cardTime: { ...type.label, color: colors.sky },
  cardTitle: { ...type.bodyLarge, color: colors.ink, marginTop: 2 },
  cardMeta: { ...type.caption, color: colors.muted, marginTop: 2 },
  actions: { alignItems: "flex-end", gap: spacing.xs },
  takenButton: {
    backgroundColor: colors.sage,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  takenButtonText: { ...type.caption, color: colors.white },
  skipText: { ...type.caption, color: colors.faint },
  doneLabel: { ...type.caption, color: colors.sage, fontWeight: "700" },
  skippedLabel: { color: colors.rose },
  scanButton: {
    margin: spacing.lg,
    backgroundColor: colors.panel2,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  scanButtonText: { ...type.bodyLarge, color: colors.ink },
});
