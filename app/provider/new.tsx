import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { createProvider } from "../../src/db/providers";
import { ScreenBackground } from "../../src/theme/ScreenBackground";
import type { ProviderKind } from "../../src/types/models";
import { colors, glass, radius, spacing, type } from "../../src/theme/tokens";

const KINDS: { key: ProviderKind; label: string }[] = [
  { key: "doctor", label: "Doctor" },
  { key: "hospital", label: "Hospital" },
  { key: "lab", label: "Lab" },
  { key: "pharmacy", label: "Pharmacy" },
];

export default function NewProviderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ kind?: string }>();
  const [kind, setKind] = useState<ProviderKind>((params.kind as ProviderKind) || "doctor");
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const handleSave = async () => {
    if (!name.trim()) return;
    await createProvider({
      kind,
      name: name.trim(),
      specialty: specialty.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
    });
    router.back();
  };

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Add to directory</Text>
        <View style={styles.chipRow}>
          {KINDS.map((k) => (
            <Pressable
              key={k.key}
              style={[styles.chip, kind === k.key && styles.chipActive]}
              onPress={() => setKind(k.key)}
            >
              <Text style={[styles.chipText, kind === k.key && styles.chipTextActive]}>{k.label}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} autoFocus />
        <TextInput style={styles.input} placeholder="Specialty (optional)" value={specialty} onChangeText={setSpecialty} />
        <TextInput style={styles.input} placeholder="Phone (optional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder="Address (optional)" value={address} onChangeText={setAddress} />
        <Pressable style={styles.button} onPress={handleSave} disabled={!name.trim()}>
          <Text style={styles.buttonText}>Save</Text>
        </Pressable>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, paddingTop: 40 },
  title: { ...type.h1, color: colors.ink, marginBottom: spacing.lg },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    borderWidth: 1, borderColor: glass.border, borderRadius: radius.pill,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: glass.fill,
  },
  chipActive: { backgroundColor: colors.sage, borderColor: colors.sage },
  chipText: { ...type.caption, color: colors.muted },
  chipTextActive: { color: colors.white },
  input: {
    ...type.bodyLarge, borderWidth: 1, borderColor: glass.border, borderRadius: radius.md,
    backgroundColor: glass.fill, paddingHorizontal: spacing.md, paddingVertical: 12,
    color: colors.ink, marginBottom: spacing.md,
  },
  button: { backgroundColor: colors.sage, borderRadius: radius.md, paddingVertical: 14, alignItems: "center", marginTop: spacing.sm },
  buttonText: { ...type.bodyLarge, color: colors.white },
});
