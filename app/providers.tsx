import { useCallback, useState } from "react";
import { Alert, FlatList, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { deleteProvider, listProviders } from "../src/db/providers";
import { GlassCard } from "../src/theme/GlassCard";
import { ScreenBackground } from "../src/theme/ScreenBackground";
import type { Provider, ProviderKind } from "../src/types/models";
import { colors, glass, radius, spacing, type } from "../src/theme/tokens";

const FILTERS: { key: ProviderKind; label: string; icon: string }[] = [
  { key: "doctor", label: "Doctors", icon: "🩺" },
  { key: "hospital", label: "Hospitals", icon: "🏥" },
  { key: "lab", label: "Labs", icon: "🧪" },
  { key: "pharmacy", label: "Pharmacies", icon: "💊" },
];

/** Care directory — doctors, hospitals, labs, pharmacies. Local address book. */
export default function ProvidersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<ProviderKind>("doctor");
  const [providers, setProviders] = useState<Provider[]>([]);

  const refresh = useCallback(async () => {
    setProviders(await listProviders(filter));
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleDelete = (p: Provider) => {
    Alert.alert("Remove from directory?", p.name, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => { await deleteProvider(p.id); refresh(); } },
    ]);
  };

  return (
    <ScreenBackground>
      <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.heading}>Care directory</Text>

        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <Pressable
              key={f.key}
              style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                {f.icon} {f.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <FlatList
          data={providers}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.empty}>No entries yet — add one below.</Text>}
          renderItem={({ item }) => (
            <GlassCard style={styles.card}>
              <View style={styles.cardMain}>
                <Text style={styles.cardName}>{item.name}</Text>
                {item.specialty ? <Text style={styles.cardMeta}>{item.specialty}</Text> : null}
                {item.address ? <Text style={styles.cardMeta}>{item.address}</Text> : null}
              </View>
              <View style={styles.cardActions}>
                {item.phone ? (
                  <Pressable style={styles.callButton} onPress={() => Linking.openURL(`tel:${item.phone}`)}>
                    <Text style={styles.callButtonText}>Call</Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={() => handleDelete(item)}>
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              </View>
            </GlassCard>
          )}
        />

        <Pressable
          style={styles.addButton}
          onPress={() => router.push({ pathname: "/provider/new", params: { kind: filter } })}
        >
          <Text style={styles.addButtonText}>+ Add {FILTERS.find((f) => f.key === filter)?.label.slice(0, -1)}</Text>
        </Pressable>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg },
  heading: { ...type.h1, color: colors.ink, marginBottom: spacing.md },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  filterChip: {
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: glass.fill,
  },
  filterChipActive: { backgroundColor: colors.sage, borderColor: colors.sage },
  filterText: { ...type.caption, color: colors.muted },
  filterTextActive: { color: colors.white },
  list: { paddingBottom: spacing.md },
  empty: { ...type.body, color: colors.faint, marginTop: spacing.xl, textAlign: "center" },
  card: { flexDirection: "row", alignItems: "center", padding: spacing.md, marginBottom: spacing.sm },
  cardMain: { flex: 1 },
  cardName: { ...type.bodyLarge, color: colors.ink },
  cardMeta: { ...type.caption, color: colors.muted, marginTop: 2 },
  cardActions: { alignItems: "flex-end", gap: spacing.xs },
  callButton: {
    backgroundColor: colors.sage,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  callButtonText: { ...type.caption, color: colors.white },
  removeText: { ...type.caption, color: colors.faint },
  addButton: {
    backgroundColor: colors.sage,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  addButtonText: { ...type.bodyLarge, color: colors.white },
});
