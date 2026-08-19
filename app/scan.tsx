import { useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

import { extractMedicationDraft } from "../src/services/ocr/OcrService";
import { colors, radius, spacing, type } from "../src/theme/tokens";

/** FRAME 05 — Scan medication. OCR capture of a strip or prescription. */
export default function ScanMedicationScreen() {
  const { familyMemberId } = useLocalSearchParams<{ familyMemberId: string }>();
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const goToConfirm = (uri?: string, draft?: { name: string; dosage: string }) => {
    router.push({
      pathname: "/confirm-medication",
      params: {
        familyMemberId,
        imageUri: uri ?? "",
        name: draft?.name ?? "",
        dosage: draft?.dosage ?? "",
      },
    });
  };

  const capture = async (source: "camera" | "library") => {
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "FamCare needs access to capture a photo of the medication."
      );
      return;
    }

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ quality: 0.6 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.6 });

    if (result.canceled || !result.assets?.[0]) return;
    const uri = result.assets[0].uri;
    setImageUri(uri);

    setProcessing(true);
    try {
      const draft = await extractMedicationDraft(uri);
      goToConfirm(uri, draft);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan a medication strip or prescription</Text>
      <Text style={styles.body}>
        Take a photo and we&apos;ll try to pre-fill the details — you&apos;ll always get a
        chance to confirm them.
      </Text>

      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.preview} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Photo / camera</Text>
        </View>
      )}

      <Pressable style={styles.button} onPress={() => capture("camera")} disabled={processing}>
        <Text style={styles.buttonText}>{processing ? "Processing..." : "Take a photo"}</Text>
      </Pressable>
      <Pressable
        style={[styles.button, styles.secondaryButton]}
        onPress={() => capture("library")}
        disabled={processing}
      >
        <Text style={styles.buttonText}>Choose from gallery</Text>
      </Pressable>
      <Pressable style={styles.textAction} onPress={() => goToConfirm()}>
        <Text style={styles.textActionLabel}>Enter details manually</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper, padding: spacing.xl, paddingTop: 40 },
  title: { ...type.h1, color: colors.ink, marginBottom: spacing.sm },
  body: { ...type.body, color: colors.muted, marginBottom: spacing.xl },
  placeholder: {
    height: 220,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderStyle: "dashed",
    backgroundColor: colors.panel2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  placeholderText: { ...type.body, color: colors.faint },
  preview: {
    height: 220,
    borderRadius: radius.lg,
    marginBottom: spacing.xl,
    backgroundColor: colors.panel2,
  },
  button: {
    backgroundColor: colors.sage,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  secondaryButton: { backgroundColor: colors.sky },
  buttonText: { ...type.bodyLarge, color: colors.white },
  textAction: { alignItems: "center", paddingVertical: spacing.md },
  textActionLabel: { ...type.body, color: colors.muted },
});
