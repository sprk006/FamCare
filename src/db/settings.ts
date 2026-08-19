import { getDb } from "./client";

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM app_settings WHERE key = ?`,
    [key]
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO app_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value]
  );
}

const ONBOARDING_KEY = "onboarding_complete";
const PHONE_KEY = "phone_number";
const SUBSCRIPTION_KEY = "subscription_tier";

export async function isOnboardingComplete(): Promise<boolean> {
  return (await getSetting(ONBOARDING_KEY)) === "1";
}

export async function setOnboardingComplete(): Promise<void> {
  await setSetting(ONBOARDING_KEY, "1");
}

export async function getPhoneNumber(): Promise<string | null> {
  return getSetting(PHONE_KEY);
}

export async function setPhoneNumber(phone: string): Promise<void> {
  await setSetting(PHONE_KEY, phone);
}

export type SubscriptionTier = "free" | "family" | "care_plus";

export async function getSubscriptionTier(): Promise<SubscriptionTier> {
  const value = await getSetting(SUBSCRIPTION_KEY);
  return (value as SubscriptionTier | null) ?? "free";
}

export async function setSubscriptionTier(tier: SubscriptionTier): Promise<void> {
  await setSetting(SUBSCRIPTION_KEY, tier);
}
