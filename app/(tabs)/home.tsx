import { useCallback, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getNextAppointment } from "../../src/db/appointments";
import { getRefillStatus, getTodayDoses, listMedications, logDose } from "../../src/db/medications";
import { listFamilyMembers } from "../../src/db/repositories";
import { getPhoneNumber } from "../../src/db/settings";
import { GlassCard } from "../../src/theme/GlassCard";
import { ScreenBackground } from "../../src/theme/ScreenBackground";
import type { AppointmentWithMember, FamilyMember, TodayDose } from "../../src/types/models";
import { colors, glass, radius, spacing, status as statusTokens, type } from "../../src/theme/tokens";

function initials(name: string): string {
  return name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function mealLabel(relation: TodayDose["mealRelation"]): string {
  if (relation === "before_food") return "Before food";
  if (relation === "after_food") return "After food";
  return "Anytime";
}

function formatAppointmentWhen(iso: string): string {
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  const datePart = sameDay ? "Today" : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${datePart}, ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

/** FRAME 07 — Home / "Today in My Family". Greeting, per-member dose list, refill + appointment nudges. */
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [doses, setDoses] = useState<TodayDose[]>([]);
  const [refillAlert, setRefillAlert] = useState<{ name: string; daysRemaining: number } | null>(null);
  const [nextAppointment, setNextAppointment] = useState<AppointmentWithMember | null>(null);
  const [firstName, setFirstName] = useState<string>("");

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
    const phone = await getPhoneNumber();
    setFirstName(list.find((m) => m.relationship === "Self")?.name?.split(/\s+/)[0] ?? (phone ? "there" : "there"));
    const current = activeId != null && list.some((m) => m.id === activeId) ? activeId : list[0]?.id ?? null;
    setActiveId(current);
    setNextAppointment(await getNextAppointment());
    if (current == null) {
      setDoses([]);
      setRefillAlert(null);
      return;
    }
    await loadForMember(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, loadForMember]);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const selectMember = (memberId: number) => {
    setActiveId(memberId);
    loadForMember(memberId);
  };

  const handleMark = async (dose: TodayDose, newStatus: "taken" | "skipped") => {
    await logDose({ medicationId: dose.medicationId, scheduledFor: dose.scheduledFor, status: newStatus });
    if (activeId != null) loadForMember(activeId);
  };

  const pending = doses.filter((d) => d.status === "pending").length;

  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.lg, paddingBottom: 92 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.greeting}>{greeting()} 👋</Text>
        <Text style={styles.subGreeting}>Here&apos;s your family today</Text>

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
              <Text style={styles.memberName} numberOfLines={1}>{m.name}</Text>
            </Pressable>
          ))}
          <Pressable style={styles.addMemberChip} onPress={() => router.push("/onboarding/add-member")}>
            <Text style={styles.addMemberChipText}>+</Text>
          </Pressable>
        </ScrollView>

        {refillAlert ? (
          <Pressable onPress={() => router.push("/(tabs)/refills")}>
            <GlassCard style={styles.banner}>
              <Text style={styles.bannerIcon}>💊</Text>
              <Text style={styles.bannerText}>
                {refillAlert.name} runs out in {refillAlert.daysRemaining} day
                {refillAlert.daysRemaining === 1 ? "" : "s"} — tap to refill
              </Text>
            </GlassCard>
          </Pressable>
        ) : null}

        {nextAppointment ? (
          <Pressable onPress={() => router.push(`/member/${nextAppointment.family_member_id}`)}>
            <GlassCard style={styles.banner}>
              <Text style={styles.bannerIcon}>🩺</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerText}>
                  {nextAppointment.familyMemberName} — {nextAppointment.title}
                </Text>
                <Text style={styles.bannerMeta}>
                  {formatAppointmentWhen(nextAppointment.scheduled_for)}
                  {nextAppointment.doctor_name ? ` · ${nextAppointment.doctor_name}` : ""}
                </Text>
              </View>
            </GlassCard>
          </Pressable>
        ) : null}

        <Text style={styles.sectionLabel}>
          {pending > 0 ? `${pending} dose${pending === 1 ? "" : "s"} left today` : "Today's doses"}
        </Text>

        <FlatList
          data={doses}
          scrollEnabled={false}
          keyExtractor={(item) => `${item.medicationId}-${item.scheduledFor}`}
          ListEmptyComponent={<Text style={styles.empty}>No medications scheduled yet.</Text>}
          renderItem={({ item }) => (
            <GlassCard style={styles.doseCard}>
              <View style={styles.cardMain}>
                <Text style={styles.cardTime}>{formatTime(item.scheduledFor)}</Text>
                <Text style={styles.cardTitle}>
                  {item.medicationName}{item.dosage ? ` — ${item.dosage}` : ""}
                </Text>
                <Text style={styles.cardMeta}>{mealLabel(item.mealRelation)}</Text>
              </View>
              {item.status === "pending" ? (
                <View style={styles.actions}>
                  <Pressable style={styles.takenButton} onPress={() => handleMark(item, "taken")}>
                    <Text style={styles.takenButtonText}>Taken</Text>
                  </Pressable>
                  <Pressable onPress={() => handleMark(item, "skipped")}>
                    <Text style={styles.skipText}>Skip</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={[styles.statusPill, item.status === "skipped" && styles.statusPillSkip]}>
                  <Text style={[styles.statusPillText, item.status === "skipped" && styles.statusPillTextSkip]}>
                    {item.status === "taken" ? "✓ Taken" : "Skipped"}
                  </Text>
                </View>
              )}
            </GlassCard>
          )}
        />

        <Pressable
          style={styles.scanButton}
          onPress={() => activeId != null && router.push({ pathname: "/scan", params: { familyMemberId: String(activeId) } })}
        >
          <Text style={styles.scanButtonText}>+ Scan new medication</Text>
        </Pressable>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg },
  greeting: { ...type.display, color: colors.ink },
  subGreeting: { ...type.body, color: colors.muted, marginTop: 2, marginBottom: spacing.lg },
  memberRow: { flexGrow: 0, marginBottom: spacing.md },
  memberRowContent: { gap: spacing.md, paddingRight: spacing.lg },
  memberChip: { alignItems: "center", width: 64 },
  avatar: {
    width: 52, height: 52, borderRadius: radius.pill,
    backgroundColor: glass.fillStrong, borderWidth: 1, borderColor: glass.border,
    alignItems: "center", justifyContent: "center",
  },
  avatarActive: { backgroundColor: colors.sage, borderColor: colors.sage },
  avatarText: { ...type.bodyLarge, color: colors.muted },
  avatarTextActive: { color: colors.white },
  memberName: { ...type.caption, color: colors.muted, marginTop: spacing.xs, textAlign: "center" },
  addMemberChip: {
    width: 52, height: 52, borderRadius: radius.pill,
    borderWidth: 1, borderColor: glass.border, borderStyle: "dashed",
    backgroundColor: glass.fillTinted, alignItems: "center", justifyContent: "center",
  },
  addMemberChipText: { ...type.h2, color: colors.sageDeep },
  banner: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, marginBottom: spacing.sm },
  bannerIcon: { fontSize: 22 },
  bannerText: { ...type.bodyLarge, color: colors.ink, flex: 1 },
  bannerMeta: { ...type.caption, color: colors.muted, marginTop: 2 },
  sectionLabel: { ...type.label, color: colors.sageDeep, marginTop: spacing.lg, marginBottom: spacing.sm },
  empty: { ...type.body, color: colors.faint, marginTop: spacing.lg, textAlign: "center" },
  doseCard: { flexDirection: "row", alignItems: "center", padding: spacing.md, marginBottom: spacing.sm },
  cardMain: { flex: 1 },
  cardTime: { ...type.label, color: colors.skyDeep },
  cardTitle: { ...type.bodyLarge, color: colors.ink, marginTop: 2 },
  cardMeta: { ...type.caption, color: colors.muted, marginTop: 2 },
  actions: { alignItems: "flex-end", gap: spacing.xs },
  takenButton: { backgroundColor: colors.sage, borderRadius: radius.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  takenButtonText: { ...type.caption, color: colors.white, fontFamily: type.bodyBold.fontFamily },
  skipText: { ...type.caption, color: colors.faint },
  statusPill: { backgroundColor: statusTokens.on_track.bg, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  statusPillText: { ...type.caption, color: statusTokens.on_track.fg },
  statusPillSkip: { backgroundColor: statusTokens.needs_attention.bg },
  statusPillTextSkip: { color: statusTokens.needs_attention.fg },
  scanButton: {
    marginTop: spacing.lg, borderRadius: radius.md, paddingVertical: 15, alignItems: "center",
    backgroundColor: glass.fillStrong, borderWidth: 1, borderColor: glass.border,
  },
  scanButtonText: { ...type.bodyLarge, color: colors.sageDeep },
});
