import { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { createCaregiver } from "../src/db/caregivers";
import { listFamilyMembers } from "../src/db/repositories";
import { getSubscriptionTier, setSubscriptionTier } from "../src/db/settings";
import { colors, radius, spacing, status as statusTokens, type } from "../src/theme/tokens";

type Permission = "view" | "manage";

/**
 * FRAME 10 — Invite caregiver. Growth-loop screen — adding member #2 is
 * also the paywall moment in the MVP journey.
 *
 * The "Upgrade & invite" action here is a prototype stub: it flips a local
 * subscription flag so the rest of the app can react to plan state, but it
 * does not process a real payment. Wire a real billing provider (Razorpay,
 * Stripe) before this ships.
 */
export default function InviteCaregiverScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [permission, setPermission] = useState<Permission>("view");
  const [memberCount, setMemberCount] = useState(0);
  const [tier, setTier] = useState<"free" | "family" | "care_plus">("free");

  const refresh = useCallback(async () => {
    setMemberCount((await listFamilyMembers()).length);
    setTier(await getSubscriptionTier());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const needsUpgrade = memberCount >= 1 && tier === "free";

  const handleUpgrade = async () => {
    await setSubscriptionTier("family");
    setTier("family");
    Alert.alert(
      "Prototype only",
      "This demo doesn't process real payments — it just switched your local plan state to \"Family plan\" so the rest of the app can reflect it."
    );
  };

  const handleInvite = async () => {
    if (!name.trim() || !contact.trim()) {
      Alert.alert("A few details needed", "Enter a name and a phone number or email to invite.");
      return;
    }
    if (needsUpgrade) {
      Alert.alert("Upgrade first", "Upgrade to the Family plan to invite another caregiver.");
      return;
    }
    // No real invite backend yet — but adding them to the local caregiver
    // list is real: it's what lets them show up as a claim option on Tasks.
    await createCaregiver({ name: name.trim() });
    Alert.alert("Invite sent", `An invite would be sent to ${contact.trim()} in a full build.`);
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add a caregiver</Text>

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Phone number or email"
        value={contact}
        onChangeText={setContact}
      />

      <View style={styles.permissionRow}>
        <Pressable
          style={[styles.permissionChip, permission === "view" && styles.permissionChipActive]}
          onPress={() => setPermission("view")}
        >
          <Text
            style={[styles.permissionChipText, permission === "view" && styles.permissionChipTextActive]}
          >
            Can view
          </Text>
        </Pressable>
        <Pressable
          style={[styles.permissionChip, permission === "manage" && styles.permissionChipActive]}
          onPress={() => setPermission("manage")}
        >
          <Text
            style={[
              styles.permissionChipText,
              permission === "manage" && styles.permissionChipTextActive,
            ]}
          >
            Can manage
          </Text>
        </Pressable>
      </View>

      {needsUpgrade ? (
        <View style={styles.paywall}>
          <View style={[styles.pill, { backgroundColor: statusTokens.family_plan.bg, alignSelf: "flex-start" }]}>
            <Text style={[styles.pillText, { color: statusTokens.family_plan.fg }]}>Family plan</Text>
          </View>
          <Text style={styles.paywallText}>
            A 2nd family member needs the Family plan — ₹149/mo (₹1,499/yr)
          </Text>
          <Pressable style={styles.upgradeButton} onPress={handleUpgrade}>
            <Text style={styles.upgradeButtonText}>Upgrade & invite</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable style={styles.button} onPress={handleInvite}>
          <Text style={styles.buttonText}>Send invite</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper, padding: spacing.xl, paddingTop: 40 },
  title: { ...type.h1, color: colors.ink, marginBottom: spacing.lg },
  input: {
    ...type.bodyLarge,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.ink,
    marginBottom: spacing.lg,
  },
  permissionRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.xl },
  permissionChip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
  },
  permissionChipActive: { backgroundColor: colors.sage, borderColor: colors.sage },
  permissionChipText: { ...type.body, color: colors.muted },
  permissionChipTextActive: { color: colors.white, fontWeight: "700" },
  button: {
    backgroundColor: colors.sage,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: { ...type.bodyLarge, color: colors.white },
  paywall: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  paywallText: { ...type.bodyLarge, color: colors.ink },
  pill: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  pillText: { ...type.caption, fontWeight: "700" },
  upgradeButton: {
    backgroundColor: colors.berry,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  upgradeButtonText: { ...type.bodyLarge, color: colors.white },
});
