import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import {
  createFamilyMember,
  deleteFamilyMember,
  listFamilyMembers,
  updateFamilyMember,
} from "../src/db/repositories";
import type { FamilyMember } from "../src/types/models";

export default function FamilyListScreen() {
  const router = useRouter();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const refresh = useCallback(() => {
    listFamilyMembers().then(setMembers).catch(console.error);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setRelationship("");
  };

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (editingId != null) {
      await updateFamilyMember(editingId, {
        name: trimmed,
        relationship: relationship.trim() || undefined,
      });
    } else {
      await createFamilyMember({
        name: trimmed,
        relationship: relationship.trim() || undefined,
      });
    }
    resetForm();
    refresh();
  };

  const handleEdit = (member: FamilyMember) => {
    setEditingId(member.id);
    setName(member.name);
    setRelationship(member.relationship ?? "");
  };

  const handleDelete = (member: FamilyMember) => {
    Alert.alert(
      "Remove family member?",
      `This deletes ${member.name} and all of their care entries and reminders.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteFamilyMember(member.id);
            if (editingId === member.id) resetForm();
            refresh();
          },
        },
      ]
    );
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
          <View style={styles.card}>
            <Pressable
              style={styles.cardMain}
              onPress={() => router.push(`/member/${item.id}`)}
            >
              <Text style={styles.cardName}>{item.name}</Text>
              {item.relationship ? (
                <Text style={styles.cardMeta}>{item.relationship}</Text>
              ) : null}
            </Pressable>
            <View style={styles.cardActions}>
              <Pressable
                style={styles.iconButton}
                onPress={() => handleEdit(item)}
              >
                <Text style={styles.iconButtonText}>Edit</Text>
              </Pressable>
              <Pressable
                style={styles.iconButton}
                onPress={() => handleDelete(item)}
              >
                <Text style={[styles.iconButtonText, styles.deleteText]}>
                  Delete
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      <View style={styles.form}>
        {editingId != null ? (
          <Text style={styles.editingLabel}>Editing family member</Text>
        ) : null}
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
        <Pressable style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>
            {editingId != null ? "Save changes" : "Add family member"}
          </Text>
        </Pressable>
        {editingId != null ? (
          <Pressable style={styles.cancelButton} onPress={resetForm}>
            <Text style={styles.cancelButtonText}>Cancel edit</Text>
          </Pressable>
        ) : null}
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
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#F2F5F9",
    marginBottom: 10,
  },
  cardMain: { flex: 1 },
  cardName: { fontSize: 17, fontWeight: "600" },
  cardMeta: { color: "#666", marginTop: 2 },
  cardActions: { flexDirection: "row", gap: 12 },
  iconButton: { paddingHorizontal: 6, paddingVertical: 4 },
  iconButtonText: { color: "#1f6feb", fontWeight: "600" },
  deleteText: { color: "#d1372f" },
  form: { borderTopWidth: 1, borderTopColor: "#eee", paddingTop: 14, gap: 8 },
  editingLabel: { color: "#1f6feb", fontWeight: "600", marginBottom: 2 },
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
  cancelButton: { alignItems: "center", paddingVertical: 6 },
  cancelButtonText: { color: "#888" },
});
