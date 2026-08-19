import { useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { seedDemoAccount } from "../../src/db/demoData";
import { colors, radius, spacing, type } from "../../src/theme/tokens";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    title: "Care that remembers for you.",
    body: "FamCare keeps medications on schedule and predicts refill needs — a coordination tool, not a chatbot.",
  },
  {
    title: "Know without asking.",
    body: "See a family member's care status at a glance — event-driven visibility, not a check-in call.",
  },
  {
    title: "One shared record.",
    body: "Everyone who cares for someone can see the same picture, instead of carrying it in their head.",
  },
];

/** FRAME 02 — Welcome. Value-prop carousel before commitment. */
export default function WelcomeScreen() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [seeding, setSeeding] = useState(false);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const handleTryDemo = async () => {
    setSeeding(true);
    try {
      await seedDemoAccount();
      router.replace("/(tabs)/home");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={styles.carousel}
      >
        {SLIDES.map((slide) => (
          <View key={slide.title} style={[styles.slide, { width }]}>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.body}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {SLIDES.map((slide, i) => (
          <View key={slide.title} style={[styles.dot, i === page && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.button} onPress={() => router.push("/onboarding/signup")}>
          <Text style={styles.buttonText}>Get started</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryAction}
          onPress={() => router.push("/onboarding/signup")}
        >
          <Text style={styles.secondaryActionText}>I already have an account</Text>
        </Pressable>
        <Pressable style={styles.secondaryAction} onPress={handleTryDemo} disabled={seeding}>
          <Text style={styles.demoActionText}>
            {seeding ? "Setting up demo..." : "Try a demo account"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper, paddingTop: 80, paddingBottom: 40 },
  carousel: { flexGrow: 0 },
  slide: { paddingHorizontal: spacing.xl, justifyContent: "center" },
  title: { ...type.display, fontSize: 26, color: colors.ink, marginBottom: spacing.md },
  body: { ...type.body, color: colors.muted },
  dots: { flexDirection: "row", justifyContent: "center", gap: spacing.sm, marginTop: spacing.xl },
  dot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.line },
  dotActive: { backgroundColor: colors.sage, width: 20 },
  actions: { paddingHorizontal: spacing.xl, marginTop: spacing.xxl, gap: spacing.sm },
  button: {
    backgroundColor: colors.sage,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: { ...type.bodyLarge, color: colors.white },
  secondaryAction: { alignItems: "center", paddingVertical: spacing.sm },
  secondaryActionText: { ...type.body, color: colors.muted },
  demoActionText: { ...type.caption, color: colors.sky, fontWeight: "700" },
});
