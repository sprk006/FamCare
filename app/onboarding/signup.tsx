import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { setPhoneNumber } from "../../src/db/settings";
import { colors, radius, spacing, type } from "../../src/theme/tokens";

/**
 * FRAME 03 — Sign up. Phone-OTP entry, <90s-to-first-reminder onboarding
 * target, no email/password friction.
 *
 * OTP verification is stubbed — there's no SMS backend wired up, so any
 * 6-digit code is accepted. Swap `verifyOtp` for a real provider
 * (e.g. Firebase Phone Auth, MSG91) before shipping.
 */
export default function SignUpScreen() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);

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
    if (!/^\d{6}$/.test(code.trim())) {
      Alert.alert("Check the code", "Enter the 6-digit code.");
      return;
    }
    await setPhoneNumber(`+91${phone.trim()}`);
    router.push("/onboarding/add-member");
  };

  return (
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
          <Pressable style={styles.button} onPress={handleVerify}>
            <Text style={styles.buttonText}>Verify</Text>
          </Pressable>
          <Pressable style={styles.secondaryAction} onPress={() => setStep("phone")}>
            <Text style={styles.secondaryActionText}>Change number</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper, padding: spacing.xl, paddingTop: 100 },
  title: { ...type.h1, color: colors.ink, marginBottom: spacing.xl },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
  },
  prefix: { ...type.bodyLarge, color: colors.muted, marginRight: spacing.sm },
  phoneInput: { ...type.bodyLarge, flex: 1, paddingVertical: 14, color: colors.ink },
  input: {
    ...type.bodyLarge,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    color: colors.ink,
  },
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
});
