# FamCare

A cross-platform (iOS/Android) mobile app for family medication coordination —
OCR medication capture, dose reminders, consumption-based refill prediction, and
remote family visibility — with all data stored **locally on-device** and an
**on-device small language model (SLM)** for private, offline assistance.

No cloud database, no cloud LLM calls by default: your family's care data never has to
leave the device. Product scope follows `design/investor_dashboard_v2.html` (MVP, Part
08); screen structure follows `design/wireframes.html`; visual language follows
`design/design_system.html`.

## Stack

- **React Native + Expo** (TypeScript, `expo-router` for navigation)
- **SQLite** via `expo-sqlite` for local, offline-first storage
- **On-device SLM** — currently stubbed behind `SlmService` (see below) so the app
  and its UI/data layer can be built and tested before the model is integrated

## App flow (prototype)

Onboarding → Capture → Core loop → Coordination → Ongoing, per the 11-frame wireframe set:

```
Splash (index.tsx)
  → onboarding/welcome        value-prop carousel
  → onboarding/signup         phone entry, stubbed OTP
  → onboarding/add-member     "who are you caring for?"
  → scan                      camera/gallery capture, stubbed OCR
  → confirm-medication        edit schedule, meal relation, pack size
  → (tabs)/home                today's doses, mark taken/skipped, member switcher
  → (tabs)/family               per-member on-track / needs-attention status
  → (tabs)/refills               consumption-based refill gauges across all meds
  → (tabs)/profile                phone, subscription, DPDP notice, log out
  → invite                     add caregiver + Family-plan paywall (prototype, no real billing)
  → member/[id]                 per-member notes/reminders + on-device assistant (carried over from the earlier scaffold)
```

Three things are intentionally stubbed, same pattern as `SlmService`'s `StubSlmService`
— built so the surrounding flow is real and testable before the real backend exists:

- **OTP verification** (`onboarding/signup.tsx`) — accepts any 6-digit code, no SMS provider wired up.
- **OCR** (`src/services/ocr/OcrService.ts`) — returns an empty draft; capture flow and confirm-screen are real, extraction isn't.
- **Payment** (`invite.tsx`) — "Upgrade & invite" flips a local subscription flag, does not process a real charge.

## Project structure

```
app/                     Expo Router screens (see flow above)
  _layout.tsx             Root stack layout
  index.tsx                Splash + session-state redirect
  onboarding/              Welcome, signup, add-member (own Stack layout)
  scan.tsx, confirm-medication.tsx   OCR capture flow
  (tabs)/                  Home, Family, Refills, Profile (Tabs layout)
  invite.tsx               Add caregiver + paywall
  member/[id].tsx          Care entries/reminders for one family member + assistant

src/
  db/
    schema.ts              SQLite table definitions (v3: + medications, dose_logs, app_settings)
    client.ts               Singleton DB handle + migration
    repositories.ts        Family members, care entries, reminders
    medications.ts         Medications, today's doses, dose logging, refill prediction, family status
    settings.ts             Local key/value app settings (onboarding, phone, subscription tier)
  services/
    ai/SlmService.ts        On-device model interface + stub + real llama.rn implementation
    ai/modelManager.ts       GGUF model download/management
    ocr/OcrService.ts        Medication-draft extraction interface + stub
    notifications.ts        Local reminder notifications
  theme/
    tokens.ts                Design tokens (colors, spacing, radius, type) from design_system.html
  types/
    models.ts               Shared TypeScript types
```

## Local SLM

`src/services/ai/SlmService.ts` defines the `SlmService` interface (`load`, `isReady`,
`complete`), a `StubSlmService`, and now a real `LocalSlmService` backed by
[`llama.rn`](https://github.com/mybigday/llama.rn) (llama.cpp bindings for React Native,
runs GGUF-quantized models — e.g. Llama 3.2 1B/3B Instruct, Phi-3.5-mini, Gemma 2 2B).

`getSlmService()` returns an `AutoSlmService` that uses `LocalSlmService` whenever a
model has been downloaded and loads successfully, and transparently falls back to the
stub otherwise (e.g. under Expo Go, before `expo prebuild`, or before the model file
exists on-device). No call site changes needed — every screen just calls
`getSlmService()`.

**To actually use the real model:**
1. Pick a GGUF model, confirm the download URL yourself, and set `MODEL_URL` in
   [`src/services/ai/modelManager.ts`](src/services/ai/modelManager.ts) — it's left
   blank on purpose since model choice/licensing is a product decision.
2. Because llama.rn ships native code, you need a development build rather than Expo
   Go: `npx expo prebuild` then `npx expo run:android` (or an EAS dev-client build).
3. In the app, open a family member and tap "Download on-device model" (only shown
   once `MODEL_URL` is configured) — it downloads once into the app's document
   directory and is loaded fully offline afterward.

## Reminders & notifications

Reminders (`src/db/repositories.ts`) get scheduled as local Android/iOS notifications
via `src/services/notifications.ts` (`expo-notifications`) — no push service involved.
Marking a reminder done or deleting it cancels its scheduled notification.

## Getting started

```bash
npm install
npx expo prebuild        # generates native android/ios projects (needed for
                          # expo-notifications' native bits and llama.rn)
npm run android           # or: npm run ios / npm run web
```

Plain Expo Go will run everything except the real on-device model (llama.rn requires a
development build); the stub assistant still works there.

## Status

The full 11-frame prototype flow is wired up end to end on local SQLite: onboarding,
medication capture (photo + manual fallback), daily dose tracking, consumption-based
refill prediction, family status visibility, and the invite/paywall screen. OTP, OCR,
and payment are deliberately stubbed (see above) — everything else is real, working
local-data flow. The assistant runs on a real on-device llama.rn model once one is
downloaded, with an automatic stub fallback otherwise.
