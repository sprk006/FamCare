import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";
import { Redirect } from "expo-router";

import { isOnboardingComplete } from "../src/db/settings";
import { ScreenBackground } from "../src/theme/ScreenBackground";
import { colors, glass, spacing, type } from "../src/theme/tokens";

// The animated splash holds for this long so the brand moment has room to
// breathe before routing onward (user asked for a ~3–5s login transition).
const SPLASH_DURATION_MS = 3600;

// Replace assets/logo.png with the real FamCare logo — this screen and the
// app icon both read from it.
const LOGO = require("../assets/logo.png");

export default function SplashScreen() {
  const [target, setTarget] = useState<"tabs" | "onboarding" | null>(null);
  const [ready, setReady] = useState(false);

  const logoScale = useRef(new Animated.Value(0.55)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.7)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const wordmarkOpacity = useRef(new Animated.Value(0)).current;
  const wordmarkTranslate = useRef(new Animated.Value(12)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const dotAnims = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 5, tension: 55, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(ringScale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(wordmarkOpacity, { toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(wordmarkTranslate, { toValue: 0, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start(() => {
      Animated.loop(
        Animated.stagger(
          160,
          dotAnims.map((dot) =>
            Animated.sequence([
              Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
              Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
            ])
          )
        )
      ).start();
    });
  }, [dotAnims, logoOpacity, logoScale, ringOpacity, ringScale, taglineOpacity, wordmarkOpacity, wordmarkTranslate]);

  useEffect(() => {
    const start = Date.now();
    isOnboardingComplete()
      .then((done) => {
        const wait = Math.max(0, SPLASH_DURATION_MS - (Date.now() - start));
        setTimeout(() => {
          setTarget(done ? "tabs" : "onboarding");
          setReady(true);
        }, wait);
      })
      .catch(() => {
        setTimeout(() => {
          setTarget("onboarding");
          setReady(true);
        }, SPLASH_DURATION_MS);
      });
  }, []);

  if (ready && target === "tabs") return <Redirect href="/(tabs)/home" />;
  if (ready && target === "onboarding") return <Redirect href="/onboarding/welcome" />;

  return (
    <ScreenBackground>
      <View style={styles.container}>
        <View style={styles.logoWrap}>
          <Animated.View
            style={[
              styles.ring,
              { opacity: ringOpacity, transform: [{ scale: ringScale }] },
            ]}
          />
          <Animated.View
            style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}
          >
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          </Animated.View>
        </View>

        <Animated.Text
          style={[
            styles.brand,
            { opacity: wordmarkOpacity, transform: [{ translateY: wordmarkTranslate }] },
          ]}
        >
          FamCare
        </Animated.Text>
        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          Remember. Anticipate. Coordinate. Care.
        </Animated.Text>

        <View style={styles.dotsRow}>
          {dotAnims.map((dot, i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }),
                  transform: [{ scale: dot.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.15] }) }],
                },
              ]}
            />
          ))}
        </View>
      </View>
    </ScreenBackground>
  );
}

const LOGO_SIZE = 132;

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  logoWrap: { alignItems: "center", justifyContent: "center", marginBottom: spacing.xl },
  ring: {
    position: "absolute",
    width: LOGO_SIZE + 44,
    height: LOGO_SIZE + 44,
    borderRadius: (LOGO_SIZE + 44) / 2,
    backgroundColor: glass.fill,
    borderWidth: 1,
    borderColor: glass.border,
  },
  logo: { width: LOGO_SIZE, height: LOGO_SIZE },
  brand: { ...type.display, fontSize: 34, color: colors.ink, letterSpacing: 0.5 },
  tagline: { ...type.caption, color: colors.muted, marginTop: spacing.sm, letterSpacing: 0.3 },
  dotsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xxl },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.sage },
});
