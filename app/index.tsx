import { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { createFamilyMember, listFamilyMembers } from "../src/db/repositories";
import type { FamilyMember } from "../src/types/models";

export default function FamilyListScreen() {
  const router = useRouter();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");

  const refresh = useCallback(() => {
    listFamilyMembers().then(setMembers).catch(console.error);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await createFamilyMember({
      name: trimmed,
      relationship: relationship.trim() || undefined,
    });
    setName("");
    setRelationship("");
    refresh();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Your family</Text>

      <FlatList
        data={members}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No one added yet. Add a family member below to start tracking
            care.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/member/${item.id}`)}
          >
            <Text style={styles.cardName}>{item.name}</Text>
            {item.relationship ? (
              <Text style={styles.cardMeta}>{item.relationship}</Text>
            ) : null}
          </Pressable>
        )}
      />

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Relationship (e.g. Mom, Dad, Son)"
          value={relationship}
          onChangeText={setRelationship}
        />
        <Pressable style={styles.button} onPress={handleAdd}>
          <Text style={styles.buttonText}>Add family member</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: "#fff" },
  heading: { fontSize: 28, fontWeight: "700", marginBottom: 16 },
  list: { flexGrow: 1, paddingBottom: 12 },
  empty: { color: "#888", marginTop: 20, textAlign: "center" },
  card: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#F2F5F9",
    marginBottom: 10,
  },
  cardName: { fontSize: 17, fontWeight: "600" },
  cardMeta: { color: "#666", marginTop: 2 },
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
  buttonText: { color: "#fff", fontWeight: "600" },
});
