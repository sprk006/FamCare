import { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { listAllMedicationsWithStatus, type MedicationWithStatus } from "../../src/db/medications";
import { GlassCard } from "../../src/theme/GlassCard";
import { ScreenBackground } from "../../src/theme/ScreenBackground";
import { colors, glass, radius, spacing, type } from "../../src/theme/tokens";

/** FRAME 08 — Refill alert, generalized into a full list across every medication. */
export default function RefillsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [meds, setMeds] = useState<MedicationWithStatus[]>([]);

  const refresh = useCallback(async () => {
    setMeds(await listAllMedicationsWithStatus());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return (
    <ScreenBackground>
      <FlatList
        data={meds}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.list,
          { paddingTop: insets.top + spacing.lg, paddingBottom: 92 },
        ]}
        ListHeaderComponent={<Text style={styles.heading}>Refills</Text>}
        ListEmptyComponent={<Text style={styles.empty}>No medications added yet.</Text>}
        renderItem={({ item }) => {
          const days = item.refill.daysRemaining;
          const pct =
            item.total_quantity > 0
              ? Math.max(0, Math.min(1, item.refill.remaining / item.total_quantity))
              : 0;
          return (
            <Pressable onPress={() => router.push(`/medication/${item.id}`)}>
              <GlassCard style={styles.card}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardMeta}>{item.familyMemberName}</Text>
              <View style={styles.gaugeTrack}>
                <View
                  style={[
                    styles.gaugeFill,
                    { width: `${pct * 100}%` },
                    item.refill.needsRefill && styles.gaugeFillLow,
                  ]}
                />
              </View>
              <Text style={styles.gaugeLabel}>
                {Math.round(item.refill.remaining)} of {Math.round(item.total_quantity)} left
                {days != null
                  ? ` · ${Math.round(days)} day${Math.round(days) === 1 ? "" : "s"} remaining`
                  : ""}
              </Text>
              {item.refill.needsRefill ? (
                <View style={styles.actions}>
                  <Pressable
                    style={styles.orderButton}
                    onPress={() =>
                      Alert.alert(
                        "Order refill",
                        "Pharmacy ordering isn't wired up in this prototype — this is a placeholder for a future flat-fee pharmacy integration."
                      )
                    }
                  >
                    <Text style={styles.orderButtonText}>Order refill</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => Alert.alert("Reminder snoozed", "We'll remind you again tomorrow.")}
                  >
                    <Text style={styles.laterText}>Remind me later</Text>
                  </Pressable>
                </View>
              ) : null}
              </GlassCard>
            </Pressable>
          );
        }}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  heading: { ...type.h1, color: colors.ink, marginBottom: spacing.lg },
  list: { paddingHorizontal: spacing.lg },
  empty: { ...type.body, color: colors.faint, marginTop: spacing.xl, textAlign: "center" },
  card: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTitle: { ...type.bodyLarge, color: colors.ink },
  cardMeta: { ...type.caption, color: colors.muted, marginTop: 2, marginBottom: spacing.sm },
  gaugeTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: "rgba(90,100,89,0.15)",
    overflow: "hidden",
  },
  gaugeFill: { height: 8, backgroundColor: colors.sky, borderRadius: radius.pill },
  gaugeFillLow: { backgroundColor: colors.rose },
  gaugeLabel: { ...type.caption, color: colors.muted, marginTop: spacing.xs },
  actions: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.sm },
  orderButton: {
    backgroundColor: colors.sky,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  orderButtonText: { ...type.caption, color: colors.white, fontWeight: "700" },
  laterText: { ...type.caption, color: colors.muted },
});
