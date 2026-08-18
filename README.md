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
`complete`) and a `StubSlmService` used for now. To wire in a real model later, swap the
stub for an implementation backed by one of:

- [`llama.rn`](https://github.com/mybigday/llama.rn) — llama.cpp bindings for React Native, runs GGUF-quantized models (e.g. Gemma, Phi, Llama 3.2 1B/3B)
- [ExecuTorch](https://github.com/pytorch-labs/executorch) via React Native bindings
- Google's MediaPipe LLM Inference API (Android-first)

No call site changes needed elsewhere in the app — everything goes through
`getSlmService()`.

## Getting started

```bash
npm install
npm run android   # or: npm run ios / npm run web
```

Because a real on-device model requires native modules, once the SLM is integrated
you'll need a development build (`expo prebuild` / EAS Build) rather than Expo Go.

## Status

Early scaffold: family member + care entry CRUD, local SQLite storage, and a stubbed
assistant interface are in place. The real on-device model integration is the next step.
