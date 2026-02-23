// hooks/use-resolved-theme.ts
import { DarkTheme, DefaultTheme, Theme } from "@react-navigation/native";
import { useColorScheme } from "react-native";
import useGoalsStore from "../store/useGoalsStore";

/**
 * Este hook centraliza:
 * - Tema real (light / dark)
 * - Theme de React Navigation
 * - Tokens de colores para UI
 */

type Tokens = {
  background: string;
  surface: string;
  text: string;
  primary: string;
  border: string;
};

export type ResolvedTheme = {
  resolvedMode: "light" | "dark";
  navTheme: Theme;
  tokens: Tokens;
};

export function useResolvedTheme(): ResolvedTheme {
  const systemScheme = useColorScheme();
  const themePref = useGoalsStore((s) => s.settings.theme);
  const accent = useGoalsStore((s) => s.settings.accentColor);

  // Determinar modo final
  let resolvedMode: "light" | "dark" = "light";

  if (themePref === "system") {
    resolvedMode = systemScheme === "dark" ? "dark" : "light";
  } else {
    resolvedMode = themePref;
  }

  const isDark = resolvedMode === "dark";

  // Theme para React Navigation
  const navTheme: Theme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: accent,
      background: isDark ? "#000000" : "#ffffff",
      card: isDark ? "#111111" : "#ffffff",
      border: isDark ? "#222222" : "#e5e5e5",
      text: isDark ? "#ffffff" : "#000000",
    },
  };

  // Tokens para tus pantallas
  const tokens: Tokens = {
    background: isDark ? "#000000" : "#ffffff",
    surface: isDark ? "#111111" : "#f9f9f9",
    text: isDark ? "#ffffff" : "#000000",
    primary: accent,
    border: isDark ? "#222222" : "#e5e5e5",
  };

  return {
    resolvedMode,
    navTheme,
    tokens,
  };
}

export default useResolvedTheme;
