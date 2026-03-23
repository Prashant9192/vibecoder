
import { ideLog } from "./ideLogger";

export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    if (typeof window === "undefined") return defaultValue;
    const stored = localStorage.getItem(`vibecoder_${key}`);
    if (!stored) return defaultValue;
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error(`Failed to parse storage key: ${key}`, e);
      return defaultValue;
    }
  },
  set: <T>(key: string, value: T): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(`vibecoder_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to set storage key: ${key}`, e);
    }
  }
};
