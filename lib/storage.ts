import {
  CONFIG_STORAGE_KEY,
  DEFAULT_CONFIG,
  mergeProfileConfig,
  type ProfileConfig,
} from "@/lib/config";

export function loadProfileConfig(): ProfileConfig {
  if (typeof window === "undefined") {
    return DEFAULT_CONFIG;
  }

  try {
    const raw = window.localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_CONFIG;
    }

    return mergeProfileConfig(JSON.parse(raw));
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveProfileConfig(config: ProfileConfig): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore write errors.
  }
}

export function resetProfileConfig(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(CONFIG_STORAGE_KEY);
}
