/** Celebration/confetti palette — keep in sync with src/app/globals.css tokens */

export const LIGHT_CELEBRATION_COLORS = [
  "#ffe500",
  "#ff6b6b",
  "#7bed9f",
  "#0a0a0a",
] as const;

export const DARK_CELEBRATION_COLORS = [
  "#d4af37",
  "#d97070",
  "#5eae7a",
  "#0a0a0a",
] as const;

export function getCelebrationColors(): readonly string[] {
  if (typeof document === "undefined") return LIGHT_CELEBRATION_COLORS;
  return document.documentElement.classList.contains("dark")
    ? DARK_CELEBRATION_COLORS
    : LIGHT_CELEBRATION_COLORS;
}
