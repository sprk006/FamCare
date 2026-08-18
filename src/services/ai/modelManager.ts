/**
 * Manages the on-device GGUF model file used by LocalSlmService.
 *
 * The model is downloaded once into the app's document directory and then
 * loaded fully offline on every later launch — FamCare never calls a cloud
 * LLM API, so there is no server-side model endpoint here.
 */

import * as FileSystem from "expo-file-system";

/**
 * Point this at a URL you've verified yourself before shipping. Any small
 * instruct-tuned GGUF model works with llama.rn (Llama 3.2 1B/3B Instruct,
 * Phi-3.5-mini, Gemma 2 2B, etc. — commonly published as quantized GGUF on
 * Hugging Face). Left blank on purpose: model choice, size, and license are
 * a product decision, and hard-coding a guessed download URL here would be
 * unsafe to ship without you checking it first.
 */
export const MODEL_URL = "";
export const MODEL_FILENAME = "slm-model.gguf";

export function isModelConfigured(): boolean {
  return MODEL_URL.length > 0;
}

function getModelPath(): string {
  return `${FileSystem.documentDirectory}${MODEL_FILENAME}`;
}

export async function isModelDownloaded(): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(getModelPath());
  return info.exists;
}

export async function getModelPathIfReady(): Promise<string | null> {
  return (await isModelDownloaded()) ? getModelPath() : null;
}

export async function downloadModel(
  onProgress?: (fractionComplete: number) => void
): Promise<string> {
  if (!isModelConfigured()) {
    throw new Error(
      "No MODEL_URL configured — set MODEL_URL in src/services/ai/modelManager.ts to a GGUF model download URL."
    );
  }
  const destination = getModelPath();
  const downloadResumable = FileSystem.createDownloadResumable(
    MODEL_URL,
    destination,
    {},
    (progress) => {
      if (progress.totalBytesExpectedToWrite > 0) {
        onProgress?.(progress.totalBytesWritten / progress.totalBytesExpectedToWrite);
      }
    }
  );
  const result = await downloadResumable.downloadAsync();
  if (!result) throw new Error("Model download did not complete.");
  return result.uri;
}

export async function deleteModel(): Promise<void> {
  const path = getModelPath();
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) {
    await FileSystem.deleteAsync(path);
  }
}
