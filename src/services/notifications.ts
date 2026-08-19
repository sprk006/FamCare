/**
 * Local (on-device) notification scheduling for reminders.
 *
 * Everything here uses Android/iOS local notifications — no push service,
 * no server round-trip — consistent with FamCare keeping data on-device.
 */

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let permissionRequested = false;

/** Requests notification permission once per app session; safe to call repeatedly. */
export async function requestNotificationPermissions(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (permissionRequested && !current.canAskAgain) return false;

  permissionRequested = true;
  const result = await Notifications.requestPermissionsAsync();
  return result.granted;
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("reminders", {
    name: "Reminders",
    importance: Notifications.AndroidImportance.HIGH,
  });
}

/**
 * Schedules a local notification for a reminder's due time.
 * Returns the OS notification id (to persist and later cancel), or null if
 * permission was denied or the due time has already passed.
 */
export async function scheduleReminderNotification(input: {
  id: number;
  title: string;
  dueAt: Date;
}): Promise<string | null> {
  if (input.dueAt.getTime() <= Date.now()) return null;

  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  await ensureAndroidChannel();

  return Notifications.scheduleNotificationAsync({
    content: {
      title: "FamCare reminder",
      body: input.title,
      data: { reminderId: input.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: input.dueAt,
      channelId: "reminders",
    },
  });
}

export async function cancelReminderNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Schedules a daily repeating alarm for each of a medication's dose times.
 * Returns the OS notification ids so they can be cancelled if the med changes.
 * "HH:MM" strings drive a DAILY trigger, so the reminder fires every day at
 * that time until cancelled.
 */
export async function scheduleDoseAlarms(input: {
  medicationName: string;
  memberName: string;
  scheduleTimes: string[];
}): Promise<string[]> {
  const granted = await requestNotificationPermissions();
  if (!granted) return [];
  await ensureAndroidChannel();

  const ids: string[] = [];
  for (const time of input.scheduleTimes) {
    const [hh, mm] = time.split(":").map((n) => parseInt(n, 10));
    if (Number.isNaN(hh) || Number.isNaN(mm)) continue;
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `💊 ${input.memberName}'s medicine`,
        body: `${input.medicationName} is due now (${time}).`,
        data: { kind: "dose" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hh,
        minute: mm,
        channelId: "reminders",
      },
    });
    ids.push(id);
  }
  return ids;
}

/** Schedules a one-off reminder a set number of hours before an appointment. */
export async function scheduleAppointmentReminder(input: {
  title: string;
  memberName: string;
  scheduledFor: Date;
  hoursBefore?: number;
}): Promise<string | null> {
  const fireAt = new Date(input.scheduledFor.getTime() - (input.hoursBefore ?? 2) * 3600 * 1000);
  if (fireAt.getTime() <= Date.now()) return null;

  const granted = await requestNotificationPermissions();
  if (!granted) return null;
  await ensureAndroidChannel();

  return Notifications.scheduleNotificationAsync({
    content: {
      title: `🩺 ${input.memberName} — upcoming appointment`,
      body: `${input.title} at ${input.scheduledFor.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.`,
      data: { kind: "appointment" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireAt,
      channelId: "reminders",
    },
  });
}

export async function cancelNotifications(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
}

/** Count of currently-scheduled local notifications (for the "alarms set" indicator). */
export async function countScheduledNotifications(): Promise<number> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.length;
}
