/**
 * SlmService — abstraction over the on-device small language model.
 *
 * This is intentionally decoupled from any specific runtime. When the real
 * model is wired in, only `LocalSlmService` needs to change (e.g. to use
 * llama.rn, ExecuTorch, or MediaPipe LLM Inference with a quantized
 * Gemma/Phi/Llama GGUF model) — every caller keeps using the same
 * `SlmService` interface.
 *
 * Nothing in this app should call a remote/cloud LLM API; FamCare's whole
 * premise is that family care data and the assistant that reasons over it
 * both stay on-device.
 */

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

let instance: SlmService | null = null;

/** Returns the app-wide SLM service singleton. */
export function getSlmService(): SlmService {
  if (!instance) {
    instance = new StubSlmService();
  }
  return instance;
}
