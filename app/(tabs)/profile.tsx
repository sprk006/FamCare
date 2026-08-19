import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getPhoneNumber, getSubscriptionTier, setSetting, type SubscriptionTier } from "../../src/db/settings";
import { GlassCard } from "../../src/theme/GlassCard";
import { ScreenBackground } from "../../src/theme/ScreenBackground";
import { colors, radius, spacing, status as statusTokens, type } from "../../src/theme/tokens";

const TIER_LABEL: Record<SubscriptionTier, string> = {
  free: "Free",
  family: "Family plan",
  care_plus: "Care+",
};

/** FRAME 11 — Settings / Profile. Account, subscription state, DPDP privacy-notice access. */
export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState<string | null>(null);
  const [tier, setTier] = useState<SubscriptionTier>("free");

  const refresh = useCallback(async () => {
    setPhone(await getPhoneNumber());
    setTier(await getSubscriptionTier());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleLogOut = () => {
    Alert.alert(
      "Log out?",
      "This resets onboarding on this device. Your family's care data stays saved locally and nothing is deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log out",
          style: "destructive",
          onPress: async () => {
            await setSetting("onboarding_complete", "0");
            router.replace("/onboarding/welcome");
          },
        },
      ]
    );
  };

  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.lg, paddingBottom: 92 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Profile</Text>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionLabel}>Phone</Text>
          <Text style={styles.sectionValue}>{phone ?? "Not set"}</Text>
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionLabel}>Subscription</Text>
          <View style={[styles.pill, tier !== "free" && { backgroundColor: statusTokens.family_plan.bg }]}>
            <Text style={[styles.pillText, tier !== "free" && { color: statusTokens.family_plan.fg }]}>
              {TIER_LABEL[tier]}
            </Text>
          </View>
        </GlassCard>

        <Pressable onPress={() => router.push("/(tabs)/family")}>
          <GlassCard style={styles.row}>
            <Text style={styles.rowLabel}>Family members</Text>
          </GlassCard>
        </Pressable>

        <Pressable
          onPress={() =>
            Alert.alert(
              "Privacy & data (DPDP)",
              "FamCare stores all care data locally on this device, aligned with India's DPDP Act 2023. Nothing is uploaded unless you explicitly enable a feature that requires it."
            )
          }
        >
          <GlassCard style={styles.row}>
            <Text style={styles.rowLabel}>Privacy &amp; data (DPDP)</Text>
          </GlassCard>
        </Pressable>

        <Pressable style={styles.logOutButton} onPress={handleLogOut}>
          <Text style={styles.logOutButtonText}>Log out</Text>
        </Pressable>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  heading: { ...type.h1, color: colors.ink, marginBottom: spacing.lg },
  section: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionLabel: { ...type.caption, color: colors.muted },
  sectionValue: { ...type.bodyLarge, color: colors.ink, marginTop: 2 },
  pill: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: statusTokens.on_track.bg,
    marginTop: spacing.xs,
  },
  pillText: { ...type.caption, color: statusTokens.on_track.fg, fontWeight: "700" },
  row: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowLabel: { ...type.bodyLarge, color: colors.ink },
  logOutButton: {
    marginTop: spacing.xl,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.rose,
  },
  logOutButtonText: { ...type.bodyLarge, color: colors.rose },
});
