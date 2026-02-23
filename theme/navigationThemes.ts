// src/theme/navigationThemes.ts
import {
    DarkTheme as RNDark,
    DefaultTheme as RNDefault,
} from "@react-navigation/native";
import { AppThemeTokens } from "./theme";

export function buildNavigationTheme(tokens: AppThemeTokens) {
  const base = tokens.mode === "dark" ? RNDark : RNDefault;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: tokens.primary,
      background: tokens.background,
      card: tokens.surface,
      text: tokens.text,
      border: tokens.border,
      notification: tokens.primary,
    },
  };
}
