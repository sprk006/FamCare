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
