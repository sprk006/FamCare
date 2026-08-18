import { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";

import { addCareEntry, listCareEntries } from "../../src/db/repositories";
import { getSlmService } from "../../src/services/ai/SlmService";
import type { CareEntry } from "../../src/types/models";

export default function MemberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const memberId = Number(id);

  const [entries, setEntries] = useState<CareEntry[]>([]);
  const [title, setTitle] = useState("");
  const [assistantReply, setAssistantReply] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  const refresh = useCallback(() => {
    if (!Number.isFinite(memberId)) return;
    listCareEntries(memberId).then(setEntries).catch(console.error);
  }, [memberId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleAddEntry = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    await addCareEntry({ familyMemberId: memberId, category: "note", title: trimmed });
    setTitle("");
    refresh();
  };

  const handleAskAssistant = async () => {
    setAsking(true);
    try {
      const slm = getSlmService();
      const summaryPrompt = entries
        .slice(0, 10)
        .map((e) => `- (${e.category}) ${e.title}`)
        .join("\n");
      const reply = await slm.complete([
        {
          role: "system",
          content:
            "You are a helpful family-care assistant running fully on-device.",
        },
        {
          role: "user",
          content: `Summarize the recent care entries:\n${summaryPrompt || "(none yet)"}`,
        },
      ]);
      setAssistantReply(reply);
    } finally {
      setAsking(false);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={entries}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No care entries logged yet.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardCategory}>{item.category}</Text>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDate}>{item.occurred_at}</Text>
          </View>
        )}
      />

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Log a note, symptom, med, or appointment..."
          value={title}
          onChangeText={setTitle}
        />
        <Pressable style={styles.button} onPress={handleAddEntry}>
          <Text style={styles.buttonText}>Add entry</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.secondaryButton]}
          onPress={handleAskAssistant}
          disabled={asking}
        >
          <Text style={styles.buttonText}>
            {asking ? "Thinking..." : "Ask on-device assistant"}
          </Text>
        </Pressable>

        {assistantReply ? (
          <Text style={styles.assistantReply}>{assistantReply}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: "#fff" },
  list: { flexGrow: 1, paddingBottom: 12 },
  empty: { color: "#888", marginTop: 20, textAlign: "center" },
  card: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#F2F5F9",
    marginBottom: 10,
  },
  cardCategory: { fontSize: 12, color: "#1f6feb", fontWeight: "700" },
  cardTitle: { fontSize: 16, fontWeight: "600", marginTop: 2 },
  cardDate: { fontSize: 12, color: "#888", marginTop: 4 },
  form: { borderTopWidth: 1, borderTopColor: "#eee", paddingTop: 14, gap: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  button: {
    backgroundColor: "#1f6feb",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  secondaryButton: { backgroundColor: "#444" },
  buttonText: { color: "#fff", fontWeight: "600" },
  assistantReply: {
    marginTop: 8,
    padding: 10,
    backgroundColor: "#FFF8E1",
    borderRadius: 10,
    color: "#333",
  },
});
