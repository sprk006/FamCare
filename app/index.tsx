import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Redirect } from "expo-router";

import { isOnboardingComplete } from "../src/db/settings";
import { colors, spacing, type } from "../src/theme/tokens";

/**
 * FRAME 01 — Splash. A brand moment while we check local session state
 * (whether onboarding has been completed) — no server round-trip, since
 * there's no server: the "session" is just local SQLite state.
 */
export default function SplashScreen() {
  const [target, setTarget] = useState<"tabs" | "onboarding" | null>(null);

  useEffect(() => {
    isOnboardingComplete()
      .then((done) => setTarget(done ? "tabs" : "onboarding"))
      .catch(() => setTarget("onboarding"));
  }, []);

  if (target === "tabs") return <Redirect href="/(tabs)/home" />;
  if (target === "onboarding") return <Redirect href="/onboarding/welcome" />;

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>FamCare</Text>
      <Text style={styles.tagline}>Care that remembers for you.</Text>
      <ActivityIndicator color={colors.sage} style={{ marginTop: spacing.xl }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  brand: { ...type.display, color: colors.ink },
  tagline: { ...type.body, color: colors.muted, marginTop: spacing.sm },
});
