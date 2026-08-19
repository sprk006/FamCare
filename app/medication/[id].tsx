import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getMedicationDayGrid, type DayCell } from "../../src/db/analytics";
import { getMedication, getRefillStatus } from "../../src/db/medications";
import { GlassCard } from "../../src/theme/GlassCard";
import { ScreenBackground } from "../../src/theme/ScreenBackground";
import type { Medication, RefillStatus } from "../../src/types/models";
import { colors, radius, spacing, type } from "../../src/theme/tokens";

const WEEKDAY = ["S", "M", "T", "W", "T", "F", "S"];

function cellColor(cell: DayCell): string {
  if (cell.future || cell.total === 0) return "rgba(90,100,89,0.12)";
  const ratio = cell.taken / cell.total;
  if (ratio === 1) return colors.sage;
  if (ratio >= 0.5) return colors.gold;
  return colors.rose;
}

function Cell({ cell, label }: { cell: DayCell; label?: string }) {
  return (
    <View style={styles.cellWrap}>
      {label ? <Text style={styles.cellLabel}>{label}</Text> : null}
      <View style={[styles.cell, { backgroundColor: cellColor(cell) }]}>
        {!cell.future && cell.total > 0 ? (
          <Text style={styles.cellText}>{cell.taken}/{cell.total}</Text>
        ) : null}
      </View>
    </View>
  );
}

/** Medication detail — weekly + monthly adherence checklist for one medication. */
export default function MedicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const medId = Number(id);
  const insets = useSafeAreaInsets();

  const [med, setMed] = useState<Medication | null>(null);
  const [refill, setRefill] = useState<RefillStatus | null>(null);
  const [week, setWeek] = useState<DayCell[]>([]);
  const [month, setMonth] = useState<DayCell[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!Number.isFinite(medId)) return;
      getMedication(medId).then(async (m) => {
        setMed(m);
        if (m) setRefill(await getRefillStatus(m));
      });
      getMedicationDayGrid(medId, 7).then(setWeek);
      getMedicationDayGrid(medId, 28).then(setMonth);
    }, [medId])
  );

  let times: string[] = [];
  try {
    times = med ? JSON.parse(med.schedule_times) : [];
  } catch {
    times = [];
  }

  const weekTaken = week.reduce((a, c) => a + c.taken, 0);
  const weekTotal = week.reduce((a, c) => a + c.total, 0);

  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.lg, paddingBottom: spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{med?.name ?? "Medication"}</Text>
        {med?.dosage ? <Text style={styles.sub}>{med.dosage}</Text> : null}

        <GlassCard style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Schedule</Text>
            <Text style={styles.infoValue}>{times.length ? times.join(", ") : "—"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Meal</Text>
            <Text style={styles.infoValue}>
              {med?.meal_relation === "before_food" ? "Before food" : med?.meal_relation === "after_food" ? "After food" : "Anytime"}
            </Text>
          </View>
          {refill ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Stock</Text>
              <Text style={[styles.infoValue, refill.needsRefill && { color: colors.roseDeep }]}>
                {Math.round(refill.remaining)} left
                {refill.daysRemaining != null ? ` · ${Math.round(refill.daysRemaining)}d` : ""}
              </Text>
            </View>
          ) : null}
        </GlassCard>

        <Text style={styles.sectionLabel}>This week · {weekTaken}/{weekTotal} taken</Text>
        <GlassCard style={styles.gridCard}>
          <View style={styles.weekRow}>
            {week.map((cell, i) => (
              <Cell key={cell.date} cell={cell} label={WEEKDAY[new Date(`${cell.date}T00:00:00`).getDay()]} />
            ))}
          </View>
        </GlassCard>

        <Text style={styles.sectionLabel}>Last 4 weeks</Text>
        <GlassCard style={styles.gridCard}>
          <View style={styles.monthGrid}>
            {month.map((cell) => (
              <View key={cell.date} style={[styles.monthCell, { backgroundColor: cellColor(cell) }]} />
            ))}
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.sage }]} /><Text style={styles.legendText}>All taken</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.gold }]} /><Text style={styles.legendText}>Partial</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.rose }]} /><Text style={styles.legendText}>Missed</Text></View>
          </View>
        </GlassCard>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg },
  title: { ...type.display, color: colors.ink },
  sub: { ...type.body, color: colors.muted, marginBottom: spacing.lg },
  infoCard: { padding: spacing.lg, marginBottom: spacing.lg, gap: spacing.sm },
  infoRow: { flexDirection: "row", justifyContent: "space-between" },
  infoLabel: { ...type.caption, color: colors.muted },
  infoValue: { ...type.bodyLarge, color: colors.ink },
  sectionLabel: { ...type.label, color: colors.sageDeep, marginBottom: spacing.sm },
  gridCard: { padding: spacing.lg, marginBottom: spacing.lg },
  weekRow: { flexDirection: "row", justifyContent: "space-between" },
  cellWrap: { alignItems: "center", gap: spacing.xs },
  cellLabel: { ...type.caption, color: colors.faint },
  cell: { width: 38, height: 38, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  cellText: { ...type.caption, color: colors.white, fontSize: 11 },
  monthGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  monthCell: { width: 26, height: 26, borderRadius: 7 },
  legend: { flexDirection: "row", gap: spacing.lg, marginTop: spacing.md },
  legendItem: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { ...type.caption, color: colors.muted },
});
