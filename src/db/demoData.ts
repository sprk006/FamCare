/**
 * Seeds a demo account so the app can be explored end-to-end without a real
 * phone-OTP backend. Mirrors the family/medication content shown in
 * design/wireframes.html (Ramesh, Sunita, "You") so the demo matches the
 * designed screens.
 */

import { createAppointment } from "./appointments";
import { createCaregiver } from "./caregivers";
import { createMedication, logDose } from "./medications";
import { createFamilyMember } from "./repositories";
import { setOnboardingComplete, setPhoneNumber } from "./settings";
import { claimTask, createTask } from "./tasks";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export async function seedDemoAccount(phone = "+91 98765 43210"): Promise<void> {
  await setPhoneNumber(phone);
  await setOnboardingComplete();

  const ramesh = await createFamilyMember({ name: "Ramesh", relationship: "Father" });
  const sunita = await createFamilyMember({ name: "Sunita", relationship: "Mother" });
  await createFamilyMember({ name: "You", relationship: "Self" });

  // Ramesh — Metformin, 3x/day, after food. Pack size deliberately small so
  // logging a couple of days of history pushes it into "needs refill".
  const metforminId = await createMedication({
    familyMemberId: ramesh,
    name: "Metformin",
    dosage: "500mg",
    mealRelation: "after_food",
    scheduleTimes: ["08:00", "13:00", "21:00"],
    quantityPerDose: 1,
    totalQuantity: 15,
    lowStockThresholdDays: 3,
  });
  for (const day of [2, 1]) {
    for (const time of ["08:00", "13:00", "21:00"]) {
      await logDose({
        medicationId: metforminId,
        scheduledFor: `${daysAgo(day)}T${time}:00`,
        status: "taken",
      });
    }
  }

  // Sunita — Glimepiride, once/day before food. Left unlogged today so the
  // Family tab's "needs attention" state can be demonstrated once that
  // slot's grace period (1hr) has passed.
  await createMedication({
    familyMemberId: sunita,
    name: "Glimepiride",
    dosage: "1mg",
    mealRelation: "before_food",
    scheduleTimes: ["07:00"],
    quantityPerDose: 1,
    totalQuantity: 30,
    lowStockThresholdDays: 3,
  });

  // v2 — Care Tasks, Appointments, and the caregiver they're assigned to.
  const sister = await createCaregiver({ name: "Sister" });
  await createTask({
    familyMemberId: ramesh,
    title: "Refill Ramesh's Metformin",
    dueDate: daysFromNow(2),
  });
  await createTask({ title: "Call insurance about renewal" });
  const claimedTask = await createTask({
    familyMemberId: sunita,
    title: "Book Sunita's thyroid follow-up",
    dueDate: daysFromNow(5),
  });
  await claimTask(claimedTask, sister);

  await createAppointment({
    familyMemberId: ramesh,
    title: "Diabetes follow-up",
    doctorName: "Dr. Sharma",
    scheduledFor: `${daysFromNow(3)}T10:30:00`,
  });
}
