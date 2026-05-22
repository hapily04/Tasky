"use client";

import { NeoIconButton } from "@/components/neo/NeoIconButton";
import { IconMoon, IconSun } from "@/components/neo/icons";
import { useTheme } from "@/components/theme/ThemeProvider";

export function ThemeToggleButton() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <NeoIconButton
      type="button"
      label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggleTheme}
      className="shrink-0"
    >
      {isDark ? <IconSun className="h-5 w-5" /> : <IconMoon className="h-5 w-5" />}
    </NeoIconButton>
  );
}
