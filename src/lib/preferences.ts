export type ThemePreference = "light" | "dark" | "system";

export function parsePreferences(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function serializePreferences(prefs: Record<string, unknown>): string {
  return JSON.stringify(prefs);
}

export function themeFromPreferences(prefs: Record<string, unknown>): ThemePreference {
  const t = prefs.theme;
  if (t === "dark") return "dark";
  return "light";
}

export function soundEnabledFromPreferences(prefs: Record<string, unknown>): boolean {
  return prefs.soundEnabled !== false;
}
