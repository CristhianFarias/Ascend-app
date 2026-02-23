// src/hooks/useAppTheme.ts
import { useTheme } from "@react-navigation/native";

/**
 * useAppTheme
 * - Wrapper pequeño que devuelve tokens comunes usados por UI (fondo, card, texto, border, primary).
 * - Usa el theme de react-navigation (ya lo provee tu ThemeProvider en app/_layout.tsx).
 */
export function useAppTheme() {
  const { colors } = useTheme();

  return {
    background: colors.background,
    card: colors.card,
    text: colors.text,
    subtext: colors.border ?? colors.text, // subtexto (fallback)
    border: colors.border,
    primary: colors.primary, // accent (proviene del theme que generas con accent desde store)
  };
}
