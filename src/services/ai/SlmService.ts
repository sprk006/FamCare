/**
 * SlmService — abstraction over the on-device small language model.
 *
 * This is intentionally decoupled from any specific runtime. `LocalSlmService`
 * below is backed by llama.rn (llama.cpp bindings for React Native) running a
 * quantized GGUF model — every caller keeps using the same `SlmService`
 * interface regardless of which backend is active.
 *
 * Nothing in this app should call a remote/cloud LLM API; FamCare's whole
 * premise is that family care data and the assistant that reasons over it
 * both stay on-device.
 *
 * llama.rn ships native code, so `LocalSlmService` only works in a
 * development build or standalone build (`expo prebuild` + `expo run:android`
 * or an EAS build) — it will fail to load under plain Expo Go. `getSlmService()`
 * detects this and falls back to the stub automatically.
 */

import type { LlamaContext } from "llama.rn";

import { getModelPathIfReady, isModelDownloaded } from "./modelManager";

export interface SlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface SlmService {
  /** True once a model is loaded and ready to run inference. */
  isReady(): boolean;

  /** Loads/warms the model. No-op if already loaded. */
  load(): Promise<void>;

  /** Runs a single-turn or multi-turn completion against the local model. */
  complete(messages: SlmMessage[]): Promise<string>;
}

/**
 * Stub implementation used until a real on-device model is integrated.
 * Lets the rest of the app (UI, prompts, care-summary features) be built
 * and tested end-to-end today.
 */
class StubSlmService implements SlmService {
  private ready = false;

  isReady(): boolean {
    return this.ready;
  }

  async load(): Promise<void> {
    // Simulate model warm-up so calling code already handles the async path
    // it will need once a real model is loaded here.
    await new Promise((resolve) => setTimeout(resolve, 50));
    this.ready = true;
  }

  async complete(messages: SlmMessage[]): Promise<string> {
    if (!this.ready) {
      await this.load();
    }
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    return (
      "[stub SLM response — no local model loaded yet] " +
      `You said: "${lastUser?.content ?? ""}"`
    );
  }
}

/**
 * Real on-device model, backed by llama.rn. Loads the GGUF file managed by
 * `modelManager` and runs inference fully offline.
 */
class LocalSlmService implements SlmService {
  private context: LlamaContext | null = null;
  private loadPromise: Promise<void> | null = null;

  isReady(): boolean {
    return this.context !== null;
  }

  async load(): Promise<void> {
    if (this.context) return;
    if (!this.loadPromise) {
      this.loadPromise = this.doLoad().finally(() => {
        this.loadPromise = null;
      });
    }
    return this.loadPromise;
  }

  private async doLoad(): Promise<void> {
    const modelPath = await getModelPathIfReady();
    if (!modelPath) {
      throw new Error(
        "Local model not downloaded yet — call downloadModel() from modelManager first."
      );
    }
    // Imported lazily so the app doesn't try to touch the native module
    // (which only exists in a dev/standalone build) until it's actually used.
    const { initLlama } = await import("llama.rn");
    this.context = await initLlama({
      model: modelPath,
      use_mlock: true,
      n_ctx: 2048,
      n_gpu_layers: 0,
    });
  }

  async complete(messages: SlmMessage[]): Promise<string> {
    if (!this.context) {
      await this.load();
    }
    if (!this.context) {
      throw new Error("Local model failed to load.");
    }
    const result = await this.context.completion({
      messages,
      n_predict: 256,
      temperature: 0.7,
    });
    return result.text.trim();
  }
}

/**
 * Picks LocalSlmService when a model has been downloaded and loads
 * successfully, otherwise transparently falls back to the stub (e.g. when
 * running in Expo Go, before prebuild, or before the model is downloaded).
 * This is what keeps call sites unchanged regardless of backend.
 */
class AutoSlmService implements SlmService {
  private local = new LocalSlmService();
  private stub = new StubSlmService();
  private useLocal = false;
  private decided = false;

  isReady(): boolean {
    return this.useLocal ? this.local.isReady() : this.stub.isReady();
  }

  async load(): Promise<void> {
    if (await isModelDownloaded()) {
      try {
        await this.local.load();
        this.useLocal = true;
        this.decided = true;
        return;
      } catch (err) {
        console.warn("Falling back to stub SLM — local model failed to load:", err);
      }
    }
    this.useLocal = false;
    this.decided = true;
    await this.stub.load();
  }

  async complete(messages: SlmMessage[]): Promise<string> {
    if (!this.decided) {
      await this.load();
    }
    return this.useLocal ? this.local.complete(messages) : this.stub.complete(messages);
  }
}

let instance: SlmService | null = null;

/** Returns the app-wide SLM service singleton. */
export function getSlmService(): SlmService {
  if (!instance) {
    instance = new AutoSlmService();
  }
  return instance;
}
