import { useCallback, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";

import { createAppointment, deleteAppointment, listAppointments } from "../../src/db/appointments";
import { createDocument, deleteDocument, listDocuments } from "../../src/db/documents";
import {
  addCareEntry,
  addReminder,
  deleteCareEntry,
  deleteReminder,
  listCareEntries,
  listUpcomingReminders,
  markReminderDone,
  setReminderNotificationId,
  updateCareEntry,
} from "../../src/db/repositories";
import { getSlmService } from "../../src/services/ai/SlmService";
import {
  downloadModel,
  isModelConfigured,
  isModelDownloaded,
} from "../../src/services/ai/modelManager";
import {
  cancelReminderNotification,
  scheduleReminderNotification,
} from "../../src/services/notifications";
import { GlassCard } from "../../src/theme/GlassCard";
import { ScreenBackground } from "../../src/theme/ScreenBackground";
import { colors, glass, radius, spacing, type } from "../../src/theme/tokens";
import type {
  Appointment,
  CareCategory,
  CareDocument,
  CareEntry,
  DocumentCategory,
  Reminder,
} from "../../src/types/models";

const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  "prescription",
  "lab_report",
  "scan",
  "insurance",
  "other",
];

const CATEGORIES: CareCategory[] = [
  "note",
  "medication",
  "appointment",
  "symptom",
  "vitals",
];

export default function MemberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const memberId = Number(id);

  const [entries, setEntries] = useState<CareEntry[]>([]);
  const [category, setCategory] = useState<CareCategory>("note");
  const [title, setTitle] = useState("");
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("");

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [apptTitle, setApptTitle] = useState("");
  const [apptDoctor, setApptDoctor] = useState("");
  const [apptLocation, setApptLocation] = useState("");
  const [apptDate, setApptDate] = useState("");
  const [apptTime, setApptTime] = useState("");

  const [documents, setDocuments] = useState<CareDocument[]>([]);
  const [docTitle, setDocTitle] = useState("");
  const [docCategory, setDocCategory] = useState<DocumentCategory>("other");
  const [addingDocument, setAddingDocument] = useState(false);

  const [assistantReply, setAssistantReply] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [downloadingModel, setDownloadingModel] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const refresh = useCallback(() => {
    if (!Number.isFinite(memberId)) return;
    listCareEntries(memberId).then(setEntries).catch(console.error);
    listUpcomingReminders(memberId).then(setReminders).catch(console.error);
    listAppointments(memberId).then(setAppointments).catch(console.error);
    listDocuments(memberId).then(setDocuments).catch(console.error);
    if (isModelConfigured()) {
      isModelDownloaded().then(setModelReady).catch(console.error);
    }
  }, [memberId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  // -- Care entries ----------------------------------------------------

  const resetEntryForm = () => {
    setEditingEntryId(null);
    setCategory("note");
    setTitle("");
  };

  const handleSubmitEntry = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    if (editingEntryId != null) {
      await updateCareEntry(editingEntryId, { category, title: trimmed });
    } else {
      await addCareEntry({ familyMemberId: memberId, category, title: trimmed });
    }
    resetEntryForm();
    refresh();
  };

  const handleEditEntry = (entry: CareEntry) => {
    setEditingEntryId(entry.id);
    setCategory(entry.category);
    setTitle(entry.title);
  };

  const handleDeleteEntry = (entry: CareEntry) => {
    Alert.alert("Delete this entry?", entry.title, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteCareEntry(entry.id);
          if (editingEntryId === entry.id) resetEntryForm();
          refresh();
        },
      },
    ]);
  };

  // -- Reminders ---------------------------------------------------------

  const handleAddReminder = async () => {
    const trimmedTitle = reminderTitle.trim();
    const dateMatch = /^\d{4}-\d{2}-\d{2}$/.test(reminderDate.trim());
    const timeMatch = /^\d{2}:\d{2}$/.test(reminderTime.trim());
    if (!trimmedTitle || !dateMatch || !timeMatch) {
      Alert.alert(
        "Check reminder details",
        "Enter a title, a date as YYYY-MM-DD, and a time as HH:MM."
      );
      return;
    }
    const dueAt = new Date(`${reminderDate.trim()}T${reminderTime.trim()}:00`);
    if (Number.isNaN(dueAt.getTime()) || dueAt.getTime() < Date.now()) {
      Alert.alert("Check reminder details", "Due date/time must be in the future.");
      return;
    }

    const reminderId = await addReminder({
      familyMemberId: memberId,
      title: trimmedTitle,
      dueAt: dueAt.toISOString(),
    });
    const notificationId = await scheduleReminderNotification({
      id: reminderId,
      title: trimmedTitle,
      dueAt,
    });
    if (notificationId) {
      await setReminderNotificationId(reminderId, notificationId);
    }

    setReminderTitle("");
    setReminderDate("");
    setReminderTime("");
    refresh();
  };

  const handleMarkDone = async (reminder: Reminder) => {
    if (reminder.notification_id) {
      await cancelReminderNotification(reminder.notification_id);
    }
    await markReminderDone(reminder.id);
    refresh();
  };

  const handleDeleteReminder = (reminder: Reminder) => {
    Alert.alert("Delete this reminder?", reminder.title, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (reminder.notification_id) {
            await cancelReminderNotification(reminder.notification_id);
          }
          await deleteReminder(reminder.id);
          refresh();
        },
      },
    ]);
  };

  // -- Appointments --------------------------------------------------------

  const handleAddAppointment = async () => {
    const trimmedTitle = apptTitle.trim();
    const dateMatch = /^\d{4}-\d{2}-\d{2}$/.test(apptDate.trim());
    const timeMatch = /^\d{2}:\d{2}$/.test(apptTime.trim());
    if (!trimmedTitle || !dateMatch || !timeMatch) {
      Alert.alert(
        "Check appointment details",
        "Enter a title, a date as YYYY-MM-DD, and a time as HH:MM."
      );
      return;
    }
    const scheduledFor = new Date(`${apptDate.trim()}T${apptTime.trim()}:00`);
    if (Number.isNaN(scheduledFor.getTime())) {
      Alert.alert("Check appointment details", "That date/time doesn't look valid.");
      return;
    }
    await createAppointment({
      familyMemberId: memberId,
      title: trimmedTitle,
      doctorName: apptDoctor.trim() || undefined,
      location: apptLocation.trim() || undefined,
      scheduledFor: scheduledFor.toISOString(),
    });
    setApptTitle("");
    setApptDoctor("");
    setApptLocation("");
    setApptDate("");
    setApptTime("");
    refresh();
  };

  const handleDeleteAppointment = (appt: Appointment) => {
    Alert.alert("Delete this appointment?", appt.title, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteAppointment(appt.id);
          refresh();
        },
      },
    ]);
  };

  // -- Documents -------------------------------------------------------------

  const handleAddDocument = async (source: "camera" | "library") => {
    const trimmedTitle = docTitle.trim();
    if (!trimmedTitle) {
      Alert.alert("Add a title first", "Give the document a name before capturing it.");
      return;
    }
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "FamCare needs access to capture the document.");
      return;
    }
    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (result.canceled || !result.assets?.[0]) return;

    setAddingDocument(true);
    try {
      await createDocument({
        familyMemberId: memberId,
        title: trimmedTitle,
        category: docCategory,
        fileUri: result.assets[0].uri,
      });
      setDocTitle("");
      setDocCategory("other");
      refresh();
    } finally {
      setAddingDocument(false);
    }
  };

  const handleDeleteDocument = (doc: CareDocument) => {
    Alert.alert("Delete this document?", doc.title, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteDocument(doc.id);
          refresh();
        },
      },
    ]);
  };

  // -- Assistant -----------------------------------------------------------

  const handleDownloadModel = async () => {
    setDownloadingModel(true);
    setDownloadProgress(0);
    try {
      await downloadModel(setDownloadProgress);
      setModelReady(true);
    } catch (err) {
      Alert.alert(
        "Download failed",
        err instanceof Error ? err.message : "Could not download the model."
      );
    } finally {
      setDownloadingModel(false);
    }
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
    <ScreenBackground>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionHeading}>Care entries</Text>
      {entries.length === 0 ? (
        <Text style={styles.empty}>No care entries logged yet.</Text>
      ) : (
        entries.map((item) => (
          <GlassCard key={item.id} style={styles.card}>
            <View style={styles.cardMain}>
              <Text style={styles.cardCategory}>{item.category}</Text>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDate}>{item.occurred_at}</Text>
            </View>
            <View style={styles.cardActions}>
              <Pressable style={styles.iconButton} onPress={() => handleEditEntry(item)}>
                <Text style={styles.iconButtonText}>Edit</Text>
              </Pressable>
              <Pressable style={styles.iconButton} onPress={() => handleDeleteEntry(item)}>
                <Text style={[styles.iconButtonText, styles.deleteText]}>Delete</Text>
              </Pressable>
            </View>
          </GlassCard>
        ))
      )}

      <View style={styles.form}>
        {editingEntryId != null ? (
          <Text style={styles.editingLabel}>Editing entry</Text>
        ) : null}
        <View style={styles.categoryRow}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c}
              style={[styles.categoryChip, category === c && styles.categoryChipActive]}
              onPress={() => setCategory(c)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  category === c && styles.categoryChipTextActive,
                ]}
              >
                {c}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          style={styles.input}
          placeholder="Log a note, symptom, med, or appointment..."
          value={title}
          onChangeText={setTitle}
        />
        <Pressable style={styles.button} onPress={handleSubmitEntry}>
          <Text style={styles.buttonText}>
            {editingEntryId != null ? "Save changes" : "Add entry"}
          </Text>
        </Pressable>
        {editingEntryId != null ? (
          <Pressable style={styles.cancelButton} onPress={resetEntryForm}>
            <Text style={styles.cancelButtonText}>Cancel edit</Text>
          </Pressable>
        ) : null}

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

        {isModelConfigured() && !modelReady ? (
          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={handleDownloadModel}
            disabled={downloadingModel}
          >
            <Text style={styles.buttonText}>
              {downloadingModel
                ? `Downloading model... ${Math.round(downloadProgress * 100)}%`
                : "Download on-device model"}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.sectionHeading}>Reminders</Text>
      {reminders.length === 0 ? (
        <Text style={styles.empty}>No upcoming reminders.</Text>
      ) : (
        reminders.map((item) => (
          <GlassCard key={item.id} style={styles.card}>
            <View style={styles.cardMain}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDate}>
                {new Date(item.due_at).toLocaleString()}
              </Text>
            </View>
            <View style={styles.cardActions}>
              <Pressable style={styles.iconButton} onPress={() => handleMarkDone(item)}>
                <Text style={styles.iconButtonText}>Done</Text>
              </Pressable>
              <Pressable style={styles.iconButton} onPress={() => handleDeleteReminder(item)}>
                <Text style={[styles.iconButtonText, styles.deleteText]}>Delete</Text>
              </Pressable>
            </View>
          </GlassCard>
        ))
      )}

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Reminder title"
          value={reminderTitle}
          onChangeText={setReminderTitle}
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.rowInput]}
            placeholder="YYYY-MM-DD"
            value={reminderDate}
            onChangeText={setReminderDate}
          />
          <TextInput
            style={[styles.input, styles.rowInput]}
            placeholder="HH:MM"
            value={reminderTime}
            onChangeText={setReminderTime}
          />
        </View>
        <Pressable style={styles.button} onPress={handleAddReminder}>
          <Text style={styles.buttonText}>Add reminder</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionHeading}>Appointments</Text>
      {appointments.length === 0 ? (
        <Text style={styles.empty}>No appointments scheduled.</Text>
      ) : (
        appointments.map((item) => (
          <GlassCard key={item.id} style={styles.card}>
            <View style={styles.cardMain}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDate}>
                {new Date(item.scheduled_for).toLocaleString()}
                {item.doctor_name ? ` · ${item.doctor_name}` : ""}
                {item.location ? ` · ${item.location}` : ""}
              </Text>
            </View>
            <Pressable style={styles.iconButton} onPress={() => handleDeleteAppointment(item)}>
              <Text style={[styles.iconButtonText, styles.deleteText]}>Delete</Text>
            </Pressable>
          </GlassCard>
        ))
      )}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="e.g. Diabetes follow-up"
          value={apptTitle}
          onChangeText={setApptTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Doctor (optional)"
          value={apptDoctor}
          onChangeText={setApptDoctor}
        />
        <TextInput
          style={styles.input}
          placeholder="Location (optional)"
          value={apptLocation}
          onChangeText={setApptLocation}
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.rowInput]}
            placeholder="YYYY-MM-DD"
            value={apptDate}
            onChangeText={setApptDate}
          />
          <TextInput
            style={[styles.input, styles.rowInput]}
            placeholder="HH:MM"
            value={apptTime}
            onChangeText={setApptTime}
          />
        </View>
        <Pressable style={styles.button} onPress={handleAddAppointment}>
          <Text style={styles.buttonText}>Add appointment</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionHeading}>Documents</Text>
      {documents.length === 0 ? (
        <Text style={styles.empty}>No documents uploaded yet.</Text>
      ) : (
        <View style={styles.docGrid}>
          {documents.map((item) => (
            <Pressable key={item.id} style={styles.docTile} onPress={() => handleDeleteDocument(item)}>
              <Image source={{ uri: item.file_uri }} style={styles.docThumb} />
              <Text style={styles.docTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.docCategory}>{item.category.replace("_", " ")}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Document title, e.g. Blood Test — Aug"
          value={docTitle}
          onChangeText={setDocTitle}
        />
        <View style={styles.categoryRow}>
          {DOCUMENT_CATEGORIES.map((c) => (
            <Pressable
              key={c}
              style={[styles.categoryChip, docCategory === c && styles.categoryChipActive]}
              onPress={() => setDocCategory(c)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  docCategory === c && styles.categoryChipTextActive,
                ]}
              >
                {c.replace("_", " ")}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          style={styles.button}
          onPress={() => handleAddDocument("camera")}
          disabled={addingDocument}
        >
          <Text style={styles.buttonText}>
            {addingDocument ? "Adding..." : "Take a photo"}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.secondaryButton]}
          onPress={() => handleAddDocument("library")}
          disabled={addingDocument}
        >
          <Text style={styles.buttonText}>Choose from gallery</Text>
        </Pressable>
      </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxxl },
  sectionHeading: { ...type.label, color: colors.sageDeep, marginTop: spacing.xl, marginBottom: spacing.sm },
  empty: { ...type.body, color: colors.faint, marginTop: spacing.sm, textAlign: "center" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardMain: { flex: 1 },
  cardActions: { flexDirection: "row", gap: spacing.md },
  iconButton: { paddingHorizontal: spacing.xs, paddingVertical: spacing.xs },
  iconButtonText: { ...type.caption, color: colors.skyDeep, fontFamily: type.bodyBold.fontFamily },
  deleteText: { color: colors.roseDeep },
  cardCategory: { ...type.label, color: colors.skyDeep },
  cardTitle: { ...type.bodyLarge, color: colors.ink, marginTop: 2 },
  cardDate: { ...type.caption, color: colors.muted, marginTop: spacing.xs },
  form: {
    borderTopWidth: 1,
    borderTopColor: glass.borderSoft,
    paddingTop: spacing.lg,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  editingLabel: { ...type.caption, color: colors.skyDeep, fontFamily: type.bodyBold.fontFamily },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  categoryChip: {
    borderWidth: 1,
    borderColor: glass.border,
    backgroundColor: glass.fillTinted,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  categoryChipActive: { backgroundColor: colors.sage, borderColor: colors.sage },
  categoryChipText: { ...type.caption, color: colors.muted },
  categoryChipTextActive: { color: colors.white, fontFamily: type.bodyBold.fontFamily },
  row: { flexDirection: "row", gap: spacing.sm },
  rowInput: { flex: 1 },
  input: {
    ...type.body,
    borderWidth: 1,
    borderColor: glass.border,
    backgroundColor: glass.fillStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.ink,
  },
  button: {
    backgroundColor: colors.sage,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 4,
    alignItems: "center",
    marginTop: spacing.xs,
  },
  secondaryButton: { backgroundColor: colors.skyDeep },
  buttonText: { ...type.bodyLarge, color: colors.white },
  cancelButton: { alignItems: "center", paddingVertical: spacing.xs },
  cancelButtonText: { ...type.caption, color: colors.faint },
  assistantReply: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: "rgba(240,168,58,0.16)",
    borderRadius: radius.md,
    color: colors.ink,
    ...type.body,
  },
  docGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  docTile: { width: "31%", marginBottom: spacing.md },
  docThumb: { width: "100%", aspectRatio: 1, borderRadius: radius.md, backgroundColor: glass.fillTinted },
  docTitle: { ...type.caption, color: colors.ink, fontFamily: type.bodyBold.fontFamily, marginTop: spacing.xs },
  docCategory: { ...type.caption, color: colors.muted, textTransform: "capitalize" },
});
