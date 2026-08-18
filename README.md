# FamCare

A cross-platform (iOS/Android) mobile app for tracking family care — medications,
appointments, symptoms, vitals, and notes — with all data stored **locally on-device**
and an **on-device small language model (SLM)** for private, offline assistance.

No cloud database, no cloud LLM calls by default: your family's care data never has to
leave the device.

## Stack

- **React Native + Expo** (TypeScript, `expo-router` for navigation)
- **SQLite** via `expo-sqlite` for local, offline-first storage
- **On-device SLM** — currently stubbed behind `SlmService` (see below) so the app
  and its UI/data layer can be built and tested before the model is integrated

## Project structure

```
app/                     Expo Router screens
  _layout.tsx             Root stack layout
  index.tsx                Family member list + add form
  member/[id].tsx          Care entries for one family member + assistant

src/
  db/
    schema.ts              SQLite table definitions
    client.ts               Singleton DB handle + migration
    repositories.ts        Query functions (family members, care entries, reminders)
  services/ai/
    SlmService.ts           On-device model interface + stub implementation
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

Family member + care entry CRUD (with edit/delete), reminders with local notifications,
and local SQLite storage are in place. The assistant runs on a real on-device llama.rn
model once one is downloaded, with an automatic stub fallback otherwise.
