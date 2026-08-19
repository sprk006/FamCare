import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getAllMemberInsights, type MemberInsight } from "../../src/db/analytics";
import { GlassCard } from "../../src/theme/GlassCard";
import { ScreenBackground } from "../../src/theme/ScreenBackground";
import { colors, glass, radius, spacing, type } from "../../src/theme/tokens";

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function adherenceColor(p: number): string {
  if (p >= 0.85) return colors.sage;
  if (p >= 0.6) return colors.gold;
  return colors.rose;
}

/** A gamified "achievement" for a member, derived from their real data. */
function badges(m: MemberInsight): { icon: string; label: string }[] {
  const out: { icon: string; label: string }[] = [];
  if (m.streak >= 7) out.push({ icon: "🔥", label: `${m.streak}-day streak` });
  else if (m.streak >= 3) out.push({ icon: "✨", label: `${m.streak}-day streak` });
  if (m.monthAdherence.adherencePct >= 0.9 && m.monthAdherence.scored >= 5)
    out.push({ icon: "🏅", label: "90%+ this month" });
  if (m.monthAdherence.missed === 0 && m.monthAdherence.scored >= 5)
    out.push({ icon: "🎯", label: "No missed doses" });
  if (m.weekAdherence.adherencePct === 1 && m.weekAdherence.scored >= 3)
    out.push({ icon: "⭐", label: "Perfect week" });
  return out;
}

function AdherenceBar({ value }: { value: number }) {
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${Math.round(value * 100)}%`, backgroundColor: adherenceColor(value) }]} />
    </View>
  );
}

/** Insights — gamified per-person adherence analytics dashboard. */
export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const [insights, setInsights] = useState<MemberInsight[]>([]);

  useFocusEffect(
    useCallback(() => {
      getAllMemberInsights().then(setInsights).catch(console.error);
    }, [])
  );

  const familyWeek =
    insights.length > 0
      ? insights.reduce((a, m) => a + m.weekAdherence.adherencePct, 0) / insights.length
      : 0;
  const bestStreak = insights.reduce((a, m) => Math.max(a, m.streak), 0);
  const attention = insights.filter((m) => m.weekAdherence.missed > 0).length;

  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.lg, paddingBottom: 92 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Insights</Text>
        <Text style={styles.sub}>How your family&apos;s care is going</Text>

        <View style={styles.statRow}>
          <GlassCard style={styles.statTile} tint="strong">
            <Text style={styles.statValue}>{pct(familyWeek)}</Text>
            <Text style={styles.statLabel}>Family adherence (7d)</Text>
          </GlassCard>
          <GlassCard style={styles.statTile} tint="strong">
            <Text style={styles.statValue}>🔥 {bestStreak}</Text>
            <Text style={styles.statLabel}>Best streak</Text>
          </GlassCard>
          <GlassCard style={styles.statTile} tint="strong">
            <Text style={[styles.statValue, attention > 0 && { color: colors.roseDeep }]}>{attention}</Text>
            <Text style={styles.statLabel}>Need attention</Text>
          </GlassCard>
        </View>

        {insights.length === 0 ? (
          <Text style={styles.empty}>Add family members and medications to see insights.</Text>
        ) : null}

        {insights.map((m) => {
          const b = badges(m);
          return (
            <GlassCard key={m.memberId} style={styles.personCard}>
              <View style={styles.personHeader}>
                <Text style={styles.personName}>
                  {m.name}
                  {m.relationship ? <Text style={styles.personRel}>  {m.relationship}</Text> : null}
                </Text>
                <Text style={styles.medCount}>{m.medsCount} med{m.medsCount === 1 ? "" : "s"}</Text>
              </View>

              <View style={styles.adherenceRow}>
                <Text style={styles.adherenceLabel}>This week</Text>
                <Text style={[styles.adherenceValue, { color: adherenceColor(m.weekAdherence.adherencePct) }]}>
                  {m.weekAdherence.scored > 0 ? pct(m.weekAdherence.adherencePct) : "—"}
                </Text>
              </View>
              <AdherenceBar value={m.weekAdherence.adherencePct} />

              <View style={[styles.adherenceRow, { marginTop: spacing.md }]}>
                <Text style={styles.adherenceLabel}>This month</Text>
                <Text style={[styles.adherenceValue, { color: adherenceColor(m.monthAdherence.adherencePct) }]}>
                  {m.monthAdherence.scored > 0 ? pct(m.monthAdherence.adherencePct) : "—"}
                </Text>
              </View>
              <AdherenceBar value={m.monthAdherence.adherencePct} />

              <View style={styles.miniStats}>
                <Text style={styles.miniStat}>✓ {m.monthAdherence.taken} taken</Text>
                <Text style={styles.miniStat}>• {m.monthAdherence.skipped} skipped</Text>
                <Text style={styles.miniStat}>✕ {m.monthAdherence.missed} missed</Text>
                <Text style={styles.miniStat}>(30d)</Text>
              </View>

              {b.length > 0 ? (
                <View style={styles.badgeRow}>
                  {b.map((badge) => (
                    <View key={badge.label} style={styles.badge}>
                      <Text style={styles.badgeText}>{badge.icon} {badge.label}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </GlassCard>
          );
        })}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg },
  heading: { ...type.display, color: colors.ink },
  sub: { ...type.body, color: colors.muted, marginTop: 2, marginBottom: spacing.lg },
  statRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  statTile: { flex: 1, padding: spacing.md, alignItems: "center" },
  statValue: { ...type.h1, color: colors.sageDeep },
  statLabel: { ...type.caption, color: colors.muted, textAlign: "center", marginTop: 2 },
  empty: { ...type.body, color: colors.faint, marginTop: spacing.xl, textAlign: "center" },
  personCard: { padding: spacing.lg, marginBottom: spacing.md },
  personHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  personName: { ...type.h2, color: colors.ink },
  personRel: { ...type.caption, color: colors.muted },
  medCount: { ...type.caption, color: colors.muted },
  adherenceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: spacing.xs },
  adherenceLabel: { ...type.caption, color: colors.muted },
  adherenceValue: { ...type.h2 },
  barTrack: { height: 10, borderRadius: radius.pill, backgroundColor: "rgba(90,100,89,0.15)", overflow: "hidden" },
  barFill: { height: 10, borderRadius: radius.pill },
  miniStats: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.md },
  miniStat: { ...type.caption, color: colors.muted },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  badge: {
    backgroundColor: glass.fillStrong,
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: { ...type.caption, color: colors.ink },
});
