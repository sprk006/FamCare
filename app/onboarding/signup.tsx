import { useEffect, useRef, useState } from "react";
import { Alert, Animated, Easing, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { seedDemoAccount } from "../../src/db/demoData";
import { listFamilyMembers } from "../../src/db/repositories";
import { setOnboardingComplete, setPhoneNumber } from "../../src/db/settings";
import { ScreenBackground } from "../../src/theme/ScreenBackground";
import { colors, glass, radius, spacing, status, type } from "../../src/theme/tokens";

/**
 * FRAME 03 — Sign up. Phone-OTP entry, <90s-to-first-reminder onboarding
 * target, no email/password friction.
 *
 * OTP verification is stubbed — there's no SMS backend wired up. Two paths:
 *  - The documented demo login (DEMO_PHONE / DEMO_OTP below) is validated
 *    for real and drops straight into a fully seeded demo account, so it's
 *    always safe to hand these two numbers to someone trying the app.
 *  - Any other 10-digit number accepts any 6-digit code (the original stub
 *    behavior), for exploring onboarding from a blank account.
 * Swap both for a real provider (e.g. Firebase Phone Auth, MSG91) before
 * shipping.
 */
export const DEMO_PHONE = "7397295720";
export const DEMO_OTP = "123789";

export default function SignUpScreen() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp" | "success">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const badgeScale = useRef(new Animated.Value(0)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslate = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (step !== "success") return;
    Animated.sequence([
      Animated.parallel([
        Animated.spring(badgeScale, { toValue: 1, friction: 4.5, tension: 80, useNativeDriver: true }),
        Animated.timing(badgeOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(textTranslate, { toValue: 0, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start();

    const timer = setTimeout(() => router.replace("/(tabs)/home"), 1300);
    return () => clearTimeout(timer);
  }, [step, badgeScale, badgeOpacity, textOpacity, textTranslate, router]);

  const isDemoNumber = phone.trim() === DEMO_PHONE;

  const handleSendOtp = async () => {
    const trimmed = phone.trim();
    if (!/^\d{10}$/.test(trimmed)) {
      Alert.alert("Check your number", "Enter a 10-digit mobile number.");
      return;
    }
    setSending(true);
    // Stub: no real SMS is sent. A production build would call an OTP
    // provider here and only advance once it accepts the number.
    await new Promise((resolve) => setTimeout(resolve, 400));
    setSending(false);
    setStep("otp");
  };

  const handleVerify = async () => {
    const trimmedCode = code.trim();
    if (!/^\d{6}$/.test(trimmedCode)) {
      Alert.alert("Check the code", "Enter the 6-digit code.");
      return;
    }

    if (isDemoNumber) {
      if (trimmedCode !== DEMO_OTP) {
        Alert.alert("That code doesn't match", `Demo login: ${DEMO_PHONE} / ${DEMO_OTP}`);
        return;
      }
      setVerifying(true);
      try {
        const existing = await listFamilyMembers();
        if (existing.length === 0) {
          await seedDemoAccount(`+91${DEMO_PHONE}`);
        } else {
          await setPhoneNumber(`+91${DEMO_PHONE}`);
          await setOnboardingComplete();
        }
        setStep("success");
      } finally {
        setVerifying(false);
      }
      return;
    }

    await setPhoneNumber(`+91${phone.trim()}`);
    router.push("/onboarding/add-member");
  };

  if (step === "success") {
    return (
      <ScreenBackground>
        <View style={styles.successContainer}>
          <Animated.View
            style={[
              styles.successBadge,
              { opacity: badgeOpacity, transform: [{ scale: badgeScale }] },
            ]}
          >
            <Text style={styles.successCheck}>✓</Text>
          </Animated.View>
          <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textTranslate }] }}>
            <Text style={styles.successTitle}>You&apos;re in! 🎉</Text>
            <Text style={styles.successBody}>Demo account ready — Ramesh, Sunita, and their meds are all set up.</Text>
          </Animated.View>
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <View style={styles.container}>
      {step === "phone" ? (
        <>
          <Text style={styles.title}>Enter your phone number</Text>
          <View style={styles.phoneRow}>
            <Text style={styles.prefix}>+91</Text>
            <TextInput
              style={styles.phoneInput}
              placeholder="98765 43210"
              keyboardType="number-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
            />
          </View>
          <Text style={styles.hint}>Demo login: {DEMO_PHONE}</Text>
          <Pressable style={styles.button} onPress={handleSendOtp} disabled={sending}>
            <Text style={styles.buttonText}>{sending ? "Sending..." : "Send OTP"}</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.title}>Enter the code sent to +91 {phone}</Text>
          <TextInput
            style={styles.input}
            placeholder="6-digit code"
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={setCode}
          />
          {isDemoNumber ? <Text style={styles.hint}>Demo OTP: {DEMO_OTP}</Text> : null}
          <Pressable style={styles.button} onPress={handleVerify} disabled={verifying}>
            <Text style={styles.buttonText}>{verifying ? "Verifying..." : "Verify"}</Text>
          </Pressable>
          <Pressable style={styles.secondaryAction} onPress={() => setStep("phone")}>
            <Text style={styles.secondaryActionText}>Change number</Text>
          </Pressable>
          </>
        )}
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent", padding: spacing.xl, paddingTop: 100 },
  title: { ...type.h1, color: colors.ink, marginBottom: spacing.xl },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: radius.md,
    backgroundColor: glass.fill,
    paddingHorizontal: spacing.md,
  },
  prefix: { ...type.bodyLarge, color: colors.muted, marginRight: spacing.sm },
  phoneInput: { ...type.bodyLarge, flex: 1, paddingVertical: 14, color: colors.ink },
  input: {
    ...type.bodyLarge,
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: radius.md,
    backgroundColor: glass.fill,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    color: colors.ink,
  },
  hint: { ...type.caption, color: colors.skyDeep, marginTop: spacing.sm },
  button: {
    backgroundColor: colors.sage,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  buttonText: { ...type.bodyLarge, color: colors.white },
  secondaryAction: { alignItems: "center", paddingVertical: spacing.md },
  secondaryActionText: { ...type.body, color: colors.muted },
  successContainer: {
    flex: 1,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  successBadge: {
    width: 88,
    height: 88,
    borderRadius: radius.pill,
    backgroundColor: status.on_track.bg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  successCheck: { fontSize: 44, color: colors.sage, fontWeight: "700" },
  successTitle: { ...type.h1, color: colors.ink, textAlign: "center", marginBottom: spacing.sm },
  successBody: { ...type.body, color: colors.muted, textAlign: "center", maxWidth: 280 },
});
